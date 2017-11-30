import * as dedent from 'dedent';

import { Level, GateTypesList, InputDescription, OutputDescription } from 'client/domain/level';
import { Endpoint } from 'client/domain/endpoint';
import { LevelCheckResult, makeContinue, makeSuccess, makeFail } from 'client/domain/level-check-result';
import { Vec2 } from 'client/util/vec2';
import { getRandomId } from 'shared/utils';

export class SimplestOscillatorLevel extends Level {
    lastState: number = 0;
    stateChanges: number = 0;
    maxStateChanges: number = 20;
    counter: number = 0;

    updateAndCheck(dtSeconds: number, currentTimeSeconds: number, inputs: Endpoint[], outputs: Endpoint[]): LevelCheckResult {
        let newValue = inputs.find(input => input.tag === 'out')!.value;

        if (newValue !== this.lastState) {
            this.lastState = newValue;
            this.stateChanges += 1;
            this.counter = 0;
            if (this.stateChanges >= this.maxStateChanges) {
                return makeSuccess();
            }
        }
        
        this.counter += 1;
        if (this.counter > 8) {
           return makeFail(`Output remained unchanged for too long`);
        }

        return makeContinue();
    }

    getInitialInputs(): InputDescription[] {
        return [
            {name: 'out', tag: 'out'}
        ];
    }

    getInitialOutputs(): OutputDescription[] {
        return [
        ];
    }

    reset(): void {
        this.counter = 0;
        this.lastState = 0;
        this.stateChanges = 0;
    }

    getAvailableGateTypes(): GateTypesList {
        return {
            type: 'whitelist',
            gateTypes: ['Not']
        };
    }
}

export function createSimplestOscillatorLevel() {
    return new SimplestOscillatorLevel();
}