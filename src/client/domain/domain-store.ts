import { observable, action, computed, createTransformer } from 'mobx';

import { BoardId, Board } from 'client/domain/board';
import { Gate, GateId, GateType, GateClasses, In, GateTypes, Custom } from 'client/domain/gate';
import { Endpoint, EndpointId, EndpointType, getOppositeEndpointType } from 'client/domain/endpoint';
import { Connection, ConnectionId } from 'client/domain/connection';
import { validateObject } from 'client/util/validation';
import { getRandomId } from 'shared/utils';
import { Vec2 } from 'client/util/vec2';
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
import { IndexedGraph, aStar } from 'client/util/a-star';
import { mod } from 'client/util/math';
import { chebyshev, euclidean } from 'client/util/distance';

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
    endpoints = new EndpointsStore();
    @observable
    connections = new ConnectionsStore();
    @observable
    placeables = new PlaceablesStore();
    @observable
    customObjects = new CustomObjectsStore();
    @observable
    gates = new GatesStore(this.boards, this.placeables);
    @observable
    protected currentLevel?: Level;
    @observable
    protected currentLevelResult?: LevelCheckResult;
    @observable
    protected paused: boolean = false;

    constructor() {

    }

    getTickDurationSeconds() {
        return this.fixedDeltaSeconds;
    }

    /* Actions */

    lastTimeMs: number = NaN;
    accumulator: number = 0;
    fixedDeltaSeconds: number = 1 / 20;
    phase: 'update' | 'propagate' = 'update';
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
            //if (this.phase === 'update') {
                for (let gate of gates) {
                    this.updateGate(gate.id, this.fixedDeltaSeconds, currentTimeMs / 1000);
                }

            //    this.phase = 'propagate';
            //} else if (this.phase === 'propagate') {
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

            //   this.phase = 'update';
            //}

            this.accumulator -= this.fixedDeltaSeconds;
        }
    }

    @action updateGate(gateId: GateId, dtSeconds: number, currentTimeSeconds: number) {
        let gate = this.gates.getById(gateId),
            endpoints = this.getEndpointsOfGate(gateId),
            endpointsIds = endpoints.map(getId),
            inputs = endpoints.filter(isInput),
            outputs = endpoints.filter(isOutput),
            connections = this.connections.findAll(connection => Boolean(
                (connection.input && endpointsIds.indexOf(connection.input) >= 0) || 
                (connection.output && endpointsIds.indexOf(connection.output) >= 0) 
            ));

        for (let input of inputs) {
            if (!connections.some(connection => connection.input === input.id)) {
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
                (connection.input && this.endpoints.getById(connection.input).gateId === gateId) ||
                (connection.output && this.endpoints.getById(connection.output).gateId === gateId)
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

    getMainBoard() {
        return this.boards.find(
            board => !this.gates.some(
                gate => (gate instanceof Custom) && board.id === gate.nestedBoardId
            )
        );
    }

    getMissingEndpointType(connectionId: ConnectionId): EndpointType {
        let connection = this.connections.getById(connectionId);
        if (!connection.output && connection.input) {
            return 'output';
        } else if (connection.output && !connection.input) {
            return 'input';
        }
        console.log(connection);
        throw new Error(`getMissingEndpointType called with a fucked up connection`);
    }

    getConnectionInput(connectionId: ConnectionId) {
        let connection = this.connections.getById(connectionId);
        return connection.input || undefined;
    }

    getConnectionsOfEndpoint(endpointId: EndpointId) {
        return this.connections.findAll(connection => connection.input === endpointId || connection.output === endpointId);
    }

    getGateByEndpointId(endpointId: EndpointId): Gate {
        return this.gates.getById(this.endpoints.getById(endpointId).gateId);
    }

    getConnectionGates(connectionId: ConnectionId): Gate[] {
        let connection = this.connections.getById(connectionId),
            result = [];
        if (connection.input) {
            result.push(this.getGateByEndpointId(connection.input));
        }
        if (connection.output) {
            result.push(this.getGateByEndpointId(connection.output));
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

        return Vec2.addVec2(localPos, placeable.pos);
    }

    getEndpointPositionCenter = createTransformer((endpointId: EndpointId) => {
        return Vec2.addCartesian(
            this.getEndpointPositionTopLeft(endpointId),
            6,
            this.endpoints.getById(endpointId).type === 'input' ? 6 : -6
        );
    });

    getEndpointPositionCenterComputed(endpointId: EndpointId) {
        return computed(() => {
            return this.getEndpointPositionCenter(endpointId);
        });
    }

    /*getEndpointPositionCenter(endpointId: EndpointId): Vec2 {
        return Vec2.addCartesian(
            this.getEndpointPositionTopLeft(endpointId),
            6,
            this.endpoints.getById(endpointId).type === 'input' ? 6 : -6
        );
    }*/

    getEndpointPositionForConnection(endpointId: EndpointId): Vec2 {
        return Vec2.addCartesian(
            this.getEndpointPositionTopLeft(endpointId),
            6,
            this.endpoints.getById(endpointId).type === 'input' ? 12 : -6
        );
    }

    offsetToDir(x: number, y: number) {
        if (x === 0 && y === 0) return NaN;
        return Math.round(mod(Math.atan2(y, x), 2 * Math.PI) / (2 * Math.PI) * 8);
    }

    getNeighboringCells(cell: Vec2) {
        let result: (Vec2 & {dir:number, hash: string})[] = [];
        for (let i = -1; i <= 1; ++i) {
            for (let j = -1; j <= 1; ++j) {
                if (i === 0 && j === 0) continue;
                let x = Math.round((cell.x + i*16)/16)*16;
                let y = Math.round((cell.y + j*16)/16)*16;
                let dir = this.offsetToDir(x - cell.x, y - cell.y);
                result.push({
                    x: x, 
                    y: y,
                    dir: dir,
                    hash: this.hash(x, y, dir)
                });
            }
        }
        return result; 
    }

    hash(x: number, y: number, dir: number) {
        return `${Math.round(x / 16) * 16}:${Math.round(y / 16) * 16}:${dir}`;
    }

    isCellOccupied(x: number, y: number) {
        let cx = x * 16 + 8,
            cy = y * 16 + 8;
        for (let placeable of this.placeables.getAll()) {
            if (
                cx >= placeable.pos.x &&
                cx <= placeable.pos.x + placeable.size.x &&
                cy >= placeable.pos.y &&
                cy <= placeable.pos.y + placeable.size.y
            ) {
                return true;
            }
        }
        return false;
    }

    graph = new IndexedGraph<Vec2 & {dir: number, hash: string}>(
        index => index.hash,
        index => {
            return this.getNeighboringCells(index)
        }
    );

    getWirePath(from: Vec2, to: Vec2): Vec2[] {
        let path = aStar(
            this.graph,
            {...from, dir: NaN, hash: this.hash(from.x, from.y, NaN)}, {...to, dir: NaN, hash: this.hash(to.x, to.y, NaN)},
            {
                cost: (a, b) => {
                    let ax = Math.round(a.x / 16) * 16,
                        ay = Math.round(a.y / 16) * 16,
                        bx = Math.round(b.x / 16) * 16,
                        by = Math.round(b.y / 16) * 16;

                    let distanceCost = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
                    let turnCost = (a.dir === b.dir) ? 0 : 10;
                    let diagonalCost = (b.dir % 2 === 1) ? 5 : 0;
                    let occupiedCost = this.isCellOccupied(bx/16, by/16) ? 500 : 0;

                    return distanceCost + turnCost + diagonalCost + occupiedCost;
                },
                heuristic: (a, b) => {
                    let ax = Math.round(a.x / 16) * 16,
                        ay = Math.round(a.y / 16) * 16,
                        bx = Math.round(b.x / 16) * 16,
                        by = Math.round(b.y / 16) * 16;

                    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
                }
            }
        );
        if (!path) {
            console.log('Falsy path!');
        }
        if (path!.length <= 0) {
            console.log('Empty path!');
        }
        //console.log(path);
        //console.log(path);
        return path!.map(({x, y}) => ({x: Math.round(x / 16) * 16, y: Math.round(y / 16) * 16})).map(Vec2.fromPlainObject);
        /*return [
            from,
            Vec2.fromCartesian(from.x, to.y),
            to
        ];*/
    }

    getAllConnectionPoints(connectionId: ConnectionId): ReadonlyArray<Vec2> {
        let connection = this.connections.getById(connectionId);
        return connection.points;
        /*
        let result: Vec2[] = [];
        if (connection.input) {
            let input = this.endpoints.getById(connection.input);
            result.push(this.getEndpointPositionCenter(input.id));
        }
        
        result.push.apply(result, connection.pins);
        
        if (connection.output) {
            let output = this.endpoints.getById(connection.output);
            result.push(this.getEndpointPositionCenter(output.id));
        }

        let input = this.getConnectionInput(connectionId);
        if (input) {
            let endpointPos = this.getEndpointPositionCenter(input);
            let distanceFromStart = euclidean(result[0].x, result[0].y, endpointPos.x, endpointPos.y);
            let distanceFromEnd = euclidean(result[result.length - 1].x, result[result.length - 1].y, endpointPos.x, endpointPos.y);
            if (distanceFromStart < distanceFromEnd) {
                return result.reverse();
            }
        }

        //return this.getWirePath(result[0], result[result.length - 1]);
        return (this.getWirePath(result[0], result[result.length - 1]));*/

        //return result;
    }

    getEndpointByTag(tag: string) {
        return this.endpoints.getAll().find(endpoint => endpoint.tag === tag);
    }

    isValidConnection(connectionId: ConnectionId): boolean {
        let connection = this.connections.getById(connectionId);

        // 1 endpoint, 1 pin
        if (connection.getPinsCount() === 2 && connection.getEndpointsCount() < 2) {
            let allPoints = this.getAllConnectionPoints(connectionId);
            if (allPoints.length >= 2) {
                return euclidean(allPoints[0].x, allPoints[0].y, allPoints[allPoints.length - 1].x, allPoints[allPoints.length - 1].y) > 16;
            }
        }
        return connection.getPinsCount() >= 2;
    }

    isEndpointOccupied(endpointId: EndpointId) {
        return this.connections.some(connection => connection.input === endpointId || connection.output === endpointId);
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

    getBoardBoundingBox(boardId: BoardId): AABB {
        let left = Infinity,
            top = Infinity,
            right = -Infinity,
            bottom = -Infinity;
        //let positions = this.getAllPl
        let positions = this.placeables
            .findAll(placeable => placeable.boardId === boardId)
            .map(placeable => placeable.pos);
        if (positions.length === 0) {
            return { x: 0, y: 0, width: 1, height: 1 };
        }
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