import { observable, action, computed, createTransformer } from 'mobx';

import { BoardId, Board } from 'client/domain/board';
import { Gate, GateId, GateType, GateClasses, In, GateTypes } from 'client/domain/gate';
import { Endpoint, EndpointId, EndpointType } from 'client/domain/endpoint';
import { Connection, ConnectionId } from 'client/domain/connection';
import { validateObject } from 'client/util/validation';
import { getRandomId } from 'shared/utils';
import { Vec2 } from 'client/domain/vec2';
import { Level } from 'client/domain/level';
import { LevelCheckResult, makeContinue } from 'client/domain/level-check-result';
import { Placeable, PlaceableId } from 'client/domain/placeable';
import { AABB } from 'client/util/aabb';

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
    protected boards = observable.map<Board>({});
    @observable
    protected gates = observable.map<Gate>({});
    @observable
    protected endpoints = observable.map<Endpoint>({});
    @observable
    protected connections = observable.map<Connection>({});
    @observable
    protected placeables = observable.map<Placeable>({});
    @observable
    protected currentLevel?: Level;
    @observable
    protected currentLevelResult?: LevelCheckResult;
    @observable
    protected paused: boolean = false;

    protected past: any[] = [];
    protected future: any[] = [];
    protected maxPastLength = 10;
    protected maxFutureLength = 10;

    constructor() {

    }

    /* Views */

    getGatesOfBoard = createTransformer((boardId: BoardId) => {
        return this.gates.values().filter(gate => gate.boardId === boardId);
    });



    /* Debug */

    getFirstBoardId(): BoardId {
        return this.boards.keys()[0];
    }

    /* History */

    @action
    undo() {
        if (this.past.length < 1) return;
        let newCurrentState = this.past.pop();
        this.future.unshift(this.toPlainObject());
        this.loadState(newCurrentState);
    }

    @action
    redo() {
        if (this.future.length < 1) return;
        let newCurrentState = this.future.shift();
        this.past.push(this.toPlainObject());
        this.loadState(newCurrentState);
    }

    saveStateToHistory() {
        if (this.currentLevelResult !== undefined) {
            throw new Error(`Attempt to save state while a level is running`);
        }
        this.past.push(this.toPlainObject());
        if (this.past.length > this.maxPastLength) {
            this.past.shift();
        }
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

        let gates = this.getAllGates();
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
        let gate = this.getGateById(gateId),
            endpoints = this.getEndpointsOfGate(gateId),
            endpointsIds = endpoints.map(getId),
            inputs = endpoints.filter(isInput),
            outputs = endpoints.filter(isOutput),
            connections = this.getAllConnections().filter(connection => 
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
        let gate = this.getGateById(gateId);

        for (let output of this.getEndpointsOfGate(gateId).filter(isOutput)) {
            for (let connection of this.getConnectionsOfEndpoint(output.id)) {
                let input = this.getConnectionInput(connection.id);
                if (input) {
                    this.getEndpointById(input).value = output.value;
                }
            }
        }
    }

    @action createPlaceable(boardId: BoardId, pos: Vec2, size: Vec2, rotation: number) {
        let placeable = new Placeable(
            getRandomId(10),
            pos,
            size
        );
        this.placeables.set(placeable.id, placeable);
        return placeable;
    }

    @action createGateOnBoard(gateType: GateType, boardId: BoardId, position: Vec2) {
        let gate = Gate.fromTypeName(gateType, getRandomId(10), boardId);
        gate.placeableId = this.createPlaceable(boardId, position, Vec2.fromCartesian(96, 64), 0).id;
        this.gates.set(gate.id, gate);

        let inputsCount = GateClasses[gateType].initialInputsCount,
            outputsCount = GateClasses[gateType].initialOutputsCount;
        for (var i = 0; i < inputsCount; ++i) {
            let input = new Endpoint(getRandomId(10), 'input', gate.id);
            input.offset = ((1 / inputsCount) * (0.5 + i)) * 2 - 1;
            this.addEndpoint(input);
        }
        for (var i = 0; i < outputsCount; ++i) {
            let output = new Endpoint(getRandomId(10), 'output', gate.id);
            output.offset = ((1 / outputsCount) * (0.5 + i)) * 2 - 1;
            this.addEndpoint(output);
        }
        return gate;
    }

    @action createBoard(): Board {
        let id = getRandomId(10);
        let board = new Board(id);
        this.boards.set(id, board);
        return board;
    }

    @action createConnectionFrom(from: EndpointId): Connection {
        let id = getRandomId(10);
        let connection = new Connection(id);
        connection.endpointA = from;
        this.connections.set(connection.id, connection);
        return connection;
    }

    @action createConnectionTo(to: EndpointId): Connection {
        let id = getRandomId(10);
        let connection = new Connection(id);
        connection.endpointB = to;
        this.connections.set(connection.id, connection);
        return connection;
    }

    @action createConnectionFromTo(from: EndpointId, to: EndpointId) {
        let id = getRandomId(10);
        let connection = new Connection(id);
        connection.endpointA = from;
        connection.endpointB = to;
        this.connections.set(connection.id, connection);
        return connection;
    }

    @action addGate(gate: Gate) {
        this.gates.set(gate.id, gate);
    }

    @action addEndpoint(endpoint: Endpoint) {
        this.endpoints.set(endpoint.id, endpoint);
    }

    @action addPlaceable(placeable: Placeable) {
        this.placeables.set(placeable.id, placeable);
    }

    @action removeConnection(connectionId: ConnectionId) {
        this.connections.delete(connectionId);
    }

    @action removeJoint(connectionId: ConnectionId, joint: Vec2) {
        let connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error(`Attempt to remove joint of a non-existing connection: ${connectionId}`);
        }
        let index = connection.joints.indexOf(joint);
        if (index < 0) {
            throw new Error(`Attempt to remove joint that does not belong to connection ${connectionId}`);
        }
        connection.joints.splice(index, 1);
    }

    @action removeEndpoint(endpointId: EndpointId) {
        this.endpoints.delete(endpointId);
    }

    @action removeAllConnectionsOfGate(gateId: GateId) {
        let toRemove: ConnectionId[] = [];
        for (let connection of this.connections.values()) {
            if (
                (connection.endpointA && this.getGateIdByEndpoint(connection.endpointA) === gateId) ||
                (connection.endpointB && this.getGateIdByEndpoint(connection.endpointB) === gateId)
            ) {
                toRemove.push(connection.id);
            }
        }
        for (let connectionToRemove of toRemove) {
            this.removeConnection(connectionToRemove);
        }
    }

    @action removeAllEndpointsOfGate(gateId: GateId) {
        let toRemove: EndpointId[] = [];
        for (let endpoint of this.endpoints.values()) {
            if (endpoint.gateId === gateId) {
                toRemove.push(endpoint.id);
            }
        }
        for (let endpointToRemove of toRemove) {
            this.removeEndpoint(endpointToRemove);
        }
    }

    @action removePlaceable(placeableId: PlaceableId) {
        this.placeables.delete(placeableId);
    }

    @action removeGate(gateId: GateId) {
        this.removeAllConnectionsOfGate(gateId);
        this.removeAllEndpointsOfGate(gateId);
        this.gates.delete(gateId);
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

    isInputEndpoint(endpointId: EndpointId) {
        return this.getEndpointById(endpointId).type === 'input';
    }

    isOutputEndpoint(endpointId: EndpointId) {
        return this.getEndpointById(endpointId).type === 'output';
    }

    getMissingEndpointType(connectionId: ConnectionId): EndpointType {
        let connection = this.getConnectionById(connectionId);
        if (connection.endpointA) {
            return this.isInputEndpoint(connection.endpointA) ? 'output' : 'input';
        }
        if (connection.endpointB) {
            return this.isInputEndpoint(connection.endpointB) ? 'output' : 'input';
        }
        throw new Error(`getMissingEndpointType called with connection that has neither input nor output`);
    }

    getConnectionInput(connectionId: ConnectionId) {
        let connection = this.getConnectionById(connectionId);
        if (connection.endpointA && this.isInputEndpoint(connection.endpointA)) {
            return connection.endpointA;
        }
        if (connection.endpointB && this.isInputEndpoint(connection.endpointB)) {
            return connection.endpointB;
        }
        return null;
    }

    getConnectionsOfEndpoint(endpointId: EndpointId) {
        return this.getAllConnections().filter(connection => connection.endpointA === endpointId || connection.endpointB === endpointId);
    }

    getGateIdByEndpoint(endpointId: EndpointId) {
        return this.endpoints.get(endpointId)!.gateId;
    }

    getBoardById(boardId: BoardId): Board {
        if (!this.boards.has(boardId)) {
            throw new Error(`Board not found: ${boardId}`);
        }
        return this.boards.get(boardId)!;
    }

    getGateById(gateId: GateId): Gate {
        if (!this.gates.has(gateId)) {
            throw new Error(`Gate not found: ${gateId}`);
        }
        return this.gates.get(gateId)!;
    }

    getGateByEndpointId(endpointId: EndpointId): Gate {
        return this.getGateById(this.getEndpointById(endpointId).gateId);
    }

    getConnectionGates(connectionId: ConnectionId): Gate[] {
        let connection = this.getConnectionById(connectionId),
            result = [];
        if (connection.endpointA) {
            result.push(this.getGateByEndpointId(connection.endpointA));
        }
        if (connection.endpointB) {
            result.push(this.getGateByEndpointId(connection.endpointB));
        }
        return result;
    }

    getEndpointById(endpointId: EndpointId): Endpoint {
        if (!this.endpoints.has(endpointId)) {
            throw new Error(`Endpoint not found: ${endpointId}`);
        }
        return this.endpoints.get(endpointId)!;
    }

    getConnectionById(connectionId: ConnectionId): Connection {
        if (!this.connections.has(connectionId)) {
            throw new Error(`Connection not found: ${connectionId}`);
        }
        return this.connections.get(connectionId)!;
    }

    getPlaceableById(placeableId: PlaceableId): Placeable {
        if (!this.placeables.has(placeableId)) {
            throw new Error(`Placeable not found: ${placeableId}`);
        }
        return this.placeables.get(placeableId)!;
    }

    getCustomObjectById(customObjectId: PlaceableId): Placeable {
        if (!this.placeables.has(customObjectId)) {
            throw new Error(`Custom object not found: ${customObjectId}`);
        }
        return this.placeables.get(customObjectId)!;
    }

    getAllBoards(): Board[] {
        return this.boards.values();
    }

    getAllGates(): Gate[] {
        return this.gates.values();
    }

    getAllEndpoints(): Endpoint[] {
        return this.endpoints.values();
    }

    getAllConnections(): Connection[] {
        return this.connections.values();
    }

    getAllPlaceables(): Placeable[] {
        return this.placeables.values();
    }

    getEndpointsOfGate(gateId: GateId) {
        return this.endpoints.values().filter(endpoint => endpoint.gateId === gateId);
    }

    getEndpointPositionTopLeft(endpointId: EndpointId): Vec2 {
        let endpoint = this.endpoints.get(endpointId)!,
            gate = this.gates.get(endpoint.gateId)!,
            placeable = this.placeables.get(gate.placeableId)!,
            width = 96,
            height = 64,
            endpointWidth = 12,
            endpointHeight = 12,
            halfWidth = width / 2,
            halfHeight = height / 2,
            halfEndpointWidth = endpointWidth / 2,
            localPos = Vec2.fromCartesian(halfWidth + endpoint.offset * halfWidth - halfEndpointWidth, endpoint.type === 'output' ? 0 : height - endpointHeight);
        
        return localPos.addVec2(placeable.pos);
    }

    getEndpointPositionCenter(endpointId: EndpointId): Vec2 {
        return this.getEndpointPositionTopLeft(endpointId).addXY(6, this.endpoints.get(endpointId)!.type === 'input' ? 6 : -6);
    }

    getEndpointPositionForConnection(endpointId: EndpointId): Vec2 {
        return this.getEndpointPositionTopLeft(endpointId).addXY(6, this.endpoints.get(endpointId)!.type === 'input' ? 12 : -6);
    }

    getAllConnectionPoints(connectionId: ConnectionId): Vec2[] {
        let connection = this.connections.get(connectionId)!;
        let result: Vec2[] = [];
        if (connection.endpointA) {
            let endpointA = this.getEndpointById(connection.endpointA);
            result.push(this.getEndpointPositionTopLeft(endpointA.id));
        }
        result.push.apply(result, connection.joints);
        if (connection.endpointB) {
            let endpointB = this.getEndpointById(connection.endpointB);
            result.push(this.getEndpointPositionTopLeft(endpointB.id));
        }
        return result;
    }

    getEndpointByTag(tag: string) {
        return this.getAllEndpoints().find(endpoint => endpoint.tag === tag);
    }

    isValidConnection(connectionId: ConnectionId): boolean {
        let connection = this.connections.get(connectionId)!;
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
        return this.connections.values().some(connection => connection.endpointA === endpointId || connection.endpointB === endpointId);
    }

    gateExists(gateId: GateId): boolean {
        return this.gates.has(gateId);
    }

    connectionExists(connectionId: ConnectionId): boolean {
        return this.connections.has(connectionId);
    }

    customObjectExists(customObjectId: PlaceableId): boolean {
        return this.placeables.has(customObjectId);
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
        let positions = this.getAllPlaceables().map(placeable => placeable.pos);
        for (let {x, y} of positions) {
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

    /* Serialization */

    toPlainObject() {
        return {
            boards: this.boards.values().map(Board.toPlainObject),
            gates: this.gates.values().map(Gate.toPlainObject),
            endpoints: this.endpoints.values().map(Endpoint.toPlainObject),
            connections: this.connections.values().map(Connection.toPlainObject)
        };
    }

    @action
    loadState(obj: any, overwrite: boolean = true) {
        if (!overwrite) {
            throw new Error(`No-overwrite mode is not supported yet`);
        }
        validateObject(obj, ['boards', 'gates', 'endpoints', 'connections']);

        this.clear();

        for (let boardData of obj.boards) {
            this.boards.set(boardData.id, Board.fromPlainObject(boardData));
        }
        for (let gateData of obj.gates) {
            this.gates.set(gateData.id, Gate.fromPlainObject(gateData));
        }
        for (let endpointData of obj.endpoints) {
            this.endpoints.set(endpointData.id, Endpoint.fromPlainObject(endpointData));
        }
        for (let connectionData of obj.connections) {
            this.connections.set(connectionData.id, Connection.fromPlainObject(connectionData));
        }
    }
}