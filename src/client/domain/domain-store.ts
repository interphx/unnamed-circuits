import { observable, action, computed, createTransformer } from 'mobx';

import { BoardId, Board } from 'client/domain/board';
import { Gate, GateId, GateType, GateClasses, In, GateTypes } from 'client/domain/gate';
import { Endpoint, EndpointId, EndpointType, getOppositeEndpointType } from 'client/domain/endpoint';
import { Connection, ConnectionId } from 'client/domain/connection';
import { validateObject } from 'client/util/validation';
import { getRandomId } from 'shared/utils';
import { Vec2 } from 'client/domain/vec2';
import { Level } from 'client/domain/level';
import { LevelCheckResult, makeContinue } from 'client/domain/level-check-result';
import { Placeable, PlaceableId } from 'client/domain/placeable';
import { AABB } from 'client/util/aabb';
import { CustomObject } from 'client/domain/custom';
import { BoardsStore } from 'client/domain/stores/boards-store';
import { GatesStore } from 'client/domain/stores/gates-store';
import { EndpointsStore } from 'client/domain/stores/endpoints-store';
import { ConnectionsStore } from 'client/domain/stores/connections-store';
import { PlaceablesStore } from 'client/domain/stores/placeables-store';
import { CustomObjectsStore } from 'client/domain/stores/custom-objects-store';

function isInput(endpoint: Endpoint) {
    return endpoint.type === 'input';
}

function isOutput(endpoint: Endpoint) {
    return endpoint.type === 'output';
}

function getId<T>(obj: { id: T }) {
    return obj.id;
}

export class DomainStore {
    @observable
    boards = new BoardsStore();
    @observable
    gates = new GatesStore();
    @observable
    endpoints = new EndpointsStore();
    @observable
    connections = new ConnectionsStore();
    @observable
    placeables = new PlaceablesStore();
    @observable
    customObjects = new CustomObjectsStore();
    @observable
    protected currentLevel?: Level;
    @observable
    protected currentLevelResult?: LevelCheckResult;
    @observable
    protected paused: boolean = false;

    constructor() {

    }

    /* Actions */

    lastTimeMs: number = NaN;
    accumulator: number = 0;
    fixedDeltaSeconds: number = 1 / 20;
    @action
    update(currentTimeMs: number) {
        if (isNaN(this.lastTimeMs)) {
            this.lastTimeMs = currentTimeMs;
            return;
        }

        let dtSeconds = (currentTimeMs - this.lastTimeMs) / 1000;
        if (dtSeconds >= 0.25) {
            dtSeconds = 0.25;
        }
        this.lastTimeMs = currentTimeMs;

        if (this.paused) {
            return;
        }

        this.accumulator += dtSeconds;

        let gates = this.gates.getAll();
        while (this.accumulator >= this.fixedDeltaSeconds) {
            for (let gate of gates) {
                this.updateGate(gate.id, this.fixedDeltaSeconds, currentTimeMs / 1000);
            }
            for (let gate of gates) {
                this.propagateGateOutputs(gate.id, this.fixedDeltaSeconds, currentTimeMs / 1000);
            }

            if (this.currentLevel && this.currentLevelResult && this.currentLevelResult.type === 'continue') {
                this.currentLevelResult = this.currentLevel.updateAndCheck(
                    this.fixedDeltaSeconds,
                    currentTimeMs / 1000,
                    this.getInputsToCurrentLevel(),
                    this.getOutputFromCurrentLevel()
                );

                if (this.currentLevelResult.type === 'success') {
                    console.log(`Level solved successfully!`);
                } else if (this.currentLevelResult.type === 'fail') {
                    console.log(`Solution failed: ${this.currentLevelResult.reason}`);
                    //this.resetLevel();
                }
            }

            this.accumulator -= this.fixedDeltaSeconds;
        }
    }

    @action updateGate(gateId: GateId, dtSeconds: number, currentTimeSeconds: number) {
        let gate = this.gates.getById(gateId),
            endpoints = this.getEndpointsOfGate(gateId),
            endpointsIds = endpoints.map(getId),
            inputs = endpoints.filter(isInput),
            outputs = endpoints.filter(isOutput),
            connections = this.connections.findAll(connection =>
                endpointsIds.indexOf(connection.endpointA!) >= 0 || endpointsIds.indexOf(connection.endpointB!) >= 0
            );

        for (let input of inputs) {
            if (!connections.some(connection => connection.endpointA === input.id || connection.endpointB === input.id)) {
                input.value = 0;
            }
        }

        gate.update(inputs, outputs, dtSeconds, currentTimeSeconds);
    }

    @action propagateGateOutputs(gateId: GateId, dtSeconds: number, currentTimeSeconds: number) {
        let gate = this.gates.getById(gateId);

        for (let output of this.getEndpointsOfGate(gateId).filter(isOutput)) {
            for (let connection of this.getConnectionsOfEndpoint(output.id)) {
                let input = this.getConnectionInput(connection.id);
                if (input) {
                    this.endpoints.getById(input).value = output.value;
                }
            }
        }
    }

    @action createGateOnBoard(gateType: GateType, boardId: BoardId, position: Vec2) {
        let placeableId = this.placeables.create(boardId, position, Vec2.fromCartesian(96, 64), 0).id;
        let gate = this.gates.create(gateType, boardId, placeableId);

        let inputsCount = GateClasses[gateType].initialInputsCount,
            outputsCount = GateClasses[gateType].initialOutputsCount;
        for (var i = 0; i < inputsCount; ++i) {
            let input = this.endpoints.create('input', gate.id);
            input.offset = ((1 / inputsCount) * (0.5 + i)) * 2 - 1;
        }
        for (var i = 0; i < outputsCount; ++i) {
            let output = this.endpoints.create('output', gate.id);
            output.offset = ((1 / outputsCount) * (0.5 + i)) * 2 - 1;
        }
        return gate;
    }

    @action removeAllConnectionsOfGate(gateId: GateId) {
        let toRemove: ConnectionId[] = [];
        for (let connection of this.connections.getAll()) {
            if (
                (connection.endpointA && this.endpoints.getById(connection.endpointA).gateId === gateId) ||
                (connection.endpointB && this.endpoints.getById(connection.endpointB).gateId === gateId)
            ) {
                toRemove.push(connection.id);
            }
        }
        for (let connectionToRemove of toRemove) {
            this.connections.remove(connectionToRemove);
        }
    }

    @action removeAllEndpointsOfGate(gateId: GateId) {
        let toRemove: EndpointId[] = [];
        for (let endpoint of this.endpoints.getAll()) {
            if (endpoint.gateId === gateId) {
                toRemove.push(endpoint.id);
            }
        }
        for (let endpointToRemove of toRemove) {
            this.endpoints.remove(endpointToRemove);
        }
    }

    @action removeGate(gateId: GateId) {
        this.removeAllConnectionsOfGate(gateId);
        this.removeAllEndpointsOfGate(gateId);
        this.gates.remove(gateId);
    }

    @action startLevel() {
        this.resetLevel();
        this.resumeLevel();
    }

    @action resumeLevel() {
        this.currentLevelResult = makeContinue();
    }

    @action loadLevel(level: Level) {
        this.clear();
        level.initialize(this);

        this.currentLevel = level;
        this.currentLevelResult = undefined;
    }

    @action clear() {
        this.boards.clear();
        this.gates.clear();
        this.endpoints.clear();
        this.connections.clear();
        this.placeables.clear();
        this.customObjects.clear();
        this.currentLevel = undefined;
        this.currentLevelResult = undefined;
    }

    @action resetLevel() {
        if (!this.currentLevel) {
            throw new Error(`Attempt to reset a non-existing level`);
        }

        this.currentLevel.reset();
        this.currentLevelResult = undefined;

        for (let endpoint of this.getOutputFromCurrentLevel()) {
            endpoint.value = 0;
        }
    }

    @action restartLevel() {
        if (!this.currentLevel) {
            throw new Error(`Attempt to restart a non-existing level`);
        }

        let level = this.currentLevel;
        this.clear();
        level.reset();
        this.loadLevel(level);
    }

    @action pause() {
        this.paused = true;
    }

    @action resume() {
        this.paused = false;
    }

    /* Getters */

    getMissingEndpointType(connectionId: ConnectionId): EndpointType {
        let connection = this.connections.getById(connectionId);
        if (connection.endpointA) {
            return getOppositeEndpointType(this.endpoints.getById(connection.endpointA).type);
        }
        if (connection.endpointB) {
            return getOppositeEndpointType(this.endpoints.getById(connection.endpointB).type);
        }
        throw new Error(`getMissingEndpointType called with connection that has neither input nor output`);
    }

    getConnectionInput(connectionId: ConnectionId) {
        let connection = this.connections.getById(connectionId);
        if (connection.endpointA && this.endpoints.getById(connection.endpointA).type === 'input') {
            return connection.endpointA;
        }
        if (connection.endpointB && this.endpoints.getById(connection.endpointB).type === 'input') {
            return connection.endpointB;
        }
        return null;
    }

    getConnectionsOfEndpoint(endpointId: EndpointId) {
        return this.connections.findAll(connection => connection.endpointA === endpointId || connection.endpointB === endpointId);
    }

    getGateByEndpointId(endpointId: EndpointId): Gate {
        return this.gates.getById(this.endpoints.getById(endpointId).gateId);
    }

    getConnectionGates(connectionId: ConnectionId): Gate[] {
        let connection = this.connections.getById(connectionId),
            result = [];
        if (connection.endpointA) {
            result.push(this.getGateByEndpointId(connection.endpointA));
        }
        if (connection.endpointB) {
            result.push(this.getGateByEndpointId(connection.endpointB));
        }
        return result;
    }

    getEndpointsOfGate(gateId: GateId) {
        return this.endpoints.findAll(endpoint => endpoint.gateId === gateId);
    }

    getEndpointPositionTopLeft(endpointId: EndpointId): Vec2 {
        let endpoint = this.endpoints.getById(endpointId),
            gate = this.gates.getById(endpoint.gateId),
            placeable = this.placeables.getById(gate.placeableId),
            width = 96,
            height = 64,
            endpointWidth = 12,
            endpointHeight = 12,
            halfWidth = width / 2,
            halfHeight = height / 2,
            halfEndpointWidth = endpointWidth / 2,
            localPos = Vec2.fromCartesian(
                halfWidth + endpoint.offset * halfWidth - halfEndpointWidth, 
                endpoint.type === 'output' ? 0 : height - endpointHeight
            );

        return localPos.addVec2(placeable.pos);
    }

    getEndpointPositionCenter(endpointId: EndpointId): Vec2 {
        return this.getEndpointPositionTopLeft(endpointId).addXY(6, this.endpoints.getById(endpointId).type === 'input' ? 6 : -6);
    }

    getEndpointPositionForConnection(endpointId: EndpointId): Vec2 {
        return this.getEndpointPositionTopLeft(endpointId).addXY(6, this.endpoints.getById(endpointId).type === 'input' ? 12 : -6);
    }

    getAllConnectionPoints(connectionId: ConnectionId): Vec2[] {
        let connection = this.connections.getById(connectionId);
        let result: Vec2[] = [];
        if (connection.endpointA) {
            let endpointA = this.endpoints.getById(connection.endpointA);
            result.push(this.getEndpointPositionCenter(endpointA.id));
        }
        result.push.apply(result, connection.joints);
        if (connection.endpointB) {
            let endpointB = this.endpoints.getById(connection.endpointB);
            result.push(this.getEndpointPositionCenter(endpointB.id));
        }
        return result;
    }

    getEndpointByTag(tag: string) {
        return this.endpoints.getAll().find(endpoint => endpoint.tag === tag);
    }

    isValidConnection(connectionId: ConnectionId): boolean {
        let connection = this.connections.getById(connectionId);
        let pointsCount = 0;
        if (connection.endpointA) pointsCount += 1;
        if (connection.endpointB) pointsCount += 1;
        pointsCount += connection.joints.length;

        // 1 endpoint, 1 joint
        if (pointsCount === 2 && connection.joints.length > 0) {
            let allPoints = this.getAllConnectionPoints(connectionId);
            return allPoints[0].distanceTo(allPoints[1]) > 16;
        }
        return pointsCount >= 2;
    }

    isEndpointOccupied(endpointId: EndpointId) {
        return this.connections.some(connection => connection.endpointA === endpointId || connection.endpointB === endpointId);
    }

    getInputsToCurrentLevel(): Endpoint[] {
        if (!this.currentLevel) {
            return [];
        }

        return this.currentLevel.getInitialInputs().map(description => {
            let result = this.getEndpointByTag(description.tag);
            if (!result) {
                throw new Error(`Input ${description.tag} not found for current level`);
            }
            return result;
        });

    }

    getOutputFromCurrentLevel(): Endpoint[] {
        if (!this.currentLevel) {
            return [];
        }

        return this.currentLevel.getInitialOutputs().map(description => {
            let result = this.getEndpointByTag(description.tag);
            if (!result) {
                throw new Error(`Output ${description.tag} not found for current level`);
            }
            return result;
        });
    }

    getCurrentElementsBoundingBox(): AABB {
        let left = Infinity,
            top = Infinity,
            right = -Infinity,
            bottom = -Infinity;
        //let positions = this.getAllPl
        let positions = this.placeables.getAll().map(placeable => placeable.pos);
        for (let { x, y } of positions) {
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
        return {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top
        };
    }

    isCurrentLevelRunning(): boolean {
        return Boolean(this.currentLevelResult && this.currentLevelResult.type === 'continue');
    }

    isCurrentLevelCompleted(): boolean {
        return Boolean(this.currentLevelResult && this.currentLevelResult.type === 'success');
    }

    isCurrentLevelFailed(): boolean {
        return Boolean(this.currentLevelResult && this.currentLevelResult.type === 'fail');
    }

    getCurrentLevelResult(): LevelCheckResult | undefined {
        return this.currentLevelResult;
    }

    isPaused(): boolean {
        return this.paused;
    }

    getAvailableGateTypes(): GateType[] {
        let levelAvailableTypes = this.currentLevel ? this.currentLevel.getAvailableGateTypes() : { type: 'blacklist', gateTypes: [] as GateType[] };


        return GateTypes.filter(gateType =>
            gateType !== 'In' &&
            gateType !== 'Out' &&
            (
                !this.currentLevel ||
                (levelAvailableTypes.type === 'blacklist' && levelAvailableTypes.gateTypes.indexOf(gateType) < 0) ||
                (levelAvailableTypes.type === 'whitelist' && levelAvailableTypes.gateTypes.indexOf(gateType) >= 0)
            )
        );
    }
}