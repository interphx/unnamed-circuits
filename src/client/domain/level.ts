import { Endpoint } from 'client/domain/endpoint';
import { LevelCheckResult, makeFail, makeContinue, makeSuccess } from "client/domain/level-check-result";
import { Duration } from 'client/util/time';
import { GateType, GateTypes } from 'client/domain/gate';
import { DomainStore } from "client/domain/domain-store";
import { Vec2 } from "client/util/vec2";

function signalToString(value: number) {
    return value > 0.5 ? 'ON' : 'OFF';
}

interface BaseGateTypesList {
    gateTypes: GateType[];
}

interface GateTypesBlacklist extends BaseGateTypesList {
    type: 'blacklist';
}

interface GateTypesWhitelist extends BaseGateTypesList {
    type: 'whitelist';
}

export type GateTypesList = GateTypesBlacklist | GateTypesWhitelist;

interface IODescription {
    tag: string;
    name: string;
}

export interface InputDescription extends IODescription {
}

export interface OutputDescription extends IODescription {
}

export abstract class Level {
    abstract updateAndCheck(dtSeconds: number, currentTimeSeconds: number, inputs: Endpoint[], outputs: Endpoint[]): LevelCheckResult;
    abstract getInitialInputs(): InputDescription[];
    abstract getInitialOutputs(): OutputDescription[];
    abstract reset(): void;

    getAvailableGateTypes(): GateTypesList {
        return {
            type: 'blacklist',
            gateTypes: []
        };
    }

    initialize(domainStore: DomainStore) {
        let levelBoard = domainStore.boards.create(),
            initialInputs = this.getInitialInputs(),
            initialOutputs = this.getInitialOutputs();

        let inputsSum = (96 + 20) * initialInputs.length;
        for (var i = 0; i < initialInputs.length; ++i) {
            let inputDescription = initialInputs[i],
                gate = domainStore.createGateOnBoard('In', levelBoard.id, Vec2.snapTo(Vec2.fromCartesian(20 + (96 + 20) * i, 20), 16));

            gate.name = inputDescription.name;
            for (let endpoint of domainStore.getEndpointsOfGate(gate.id)) {
                endpoint.tag = inputDescription.tag;
            }
        }

        let outputsSum = (96 + 20) * initialOutputs.length;
        let outputsOffset = (inputsSum - outputsSum) / 2;
        for (var i = 0; i < initialOutputs.length; ++i) {
            let outputDescription = initialOutputs[i],
                gate = domainStore.createGateOnBoard('Out', levelBoard.id, Vec2.snapTo(Vec2.fromCartesian(outputsOffset + 20 + (96 + 20) * i, 500), 16));
                
            gate.name = outputDescription.name;
            for (let endpoint of domainStore.getEndpointsOfGate(gate.id)) {
                endpoint.tag = outputDescription.tag;
            }
        }
    };
}

export interface TestCase {
    givenOutput: { [tag: string]: number };
    expectedInput: { [tag: string]: number };
    readDelay: Duration;
}

export class TestCasesLevel extends Level {
    gateTypes?: GateTypesList;
    cases: TestCase[];
    currentCaseIndex: number = 0;
    delayCounter: number = 0;

    constructor(cases: TestCase[], gateTypes?: GateTypesList) {
        super();
        this.cases = cases;
        this.gateTypes = gateTypes;
    }

    updateAndCheck(dtSeconds: number, currentTimeSeconds: number, inputs: Endpoint[], outputs: Endpoint[]): LevelCheckResult {
        let currentCase = this.cases[this.currentCaseIndex];

        for (let output of outputs) {
            if (currentCase.givenOutput.hasOwnProperty(output.tag)) {
                output.value = currentCase.givenOutput[output.tag];
            } else {
                throw new Error(`Extra output passed to level check: ${output.tag}`);
            }
        }

        this.delayCounter += currentCase.readDelay.type === 'seconds' ? dtSeconds : 1;
        if (this.delayCounter >= currentCase.readDelay.value) {
            this.delayCounter = 0;
            
            for (let input of inputs) {
                if (currentCase.expectedInput.hasOwnProperty(input.tag)) {
                    let expected = currentCase.expectedInput[input.tag];
                    if (expected !== input.value) {
                        return makeFail(`Expected ${input.tag} = ${ signalToString(expected) },\n but it is ${ signalToString(input.value) }`);
                    }
                } else {
                    throw new Error(`Extra input passed to level check: ${input.tag}`);
                }
            }

            if (this.currentCaseIndex < this.cases.length - 1) {
                this.currentCaseIndex += 1;
            } else {
                return makeSuccess();
            }
        }

        return makeContinue();
    }

    getInitialInputs(): InputDescription[] {
        return Object.keys(this.cases[0].expectedInput).map(tag => ({ tag, name: tag }));
    }

    getInitialOutputs(): OutputDescription[] {
        return Object.keys(this.cases[0].givenOutput).map(tag => ({ tag, name: tag }));
    }

    getAvailableGateTypes() {
        if (!this.gateTypes) {
            return super.getAvailableGateTypes();
        }
        return this.gateTypes;
    }

    reset() {
        this.currentCaseIndex = 0;
        this.delayCounter = 0;
    }

    initialize(domainStore: DomainStore) {
        super.initialize(domainStore);
    }
}