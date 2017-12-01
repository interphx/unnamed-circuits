import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { Vec2 } from 'client/util/vec2';
import { Connection } from 'client/domain/connection';
import { Endpoint } from 'client/domain/endpoint';
import { euclidean } from 'client/util/distance';

interface EndpointAtPos {
    endpoint: Endpoint;
    pos: Vec2;
}

export class MovePin extends DragInteraction {

    connection: Connection;
    pinId: string;
    isEnd: boolean;
    snapEndpoint?: Endpoint;

    lastGridPos: Vec2;

    constructor(
        startPos: Vec2, 
        connection: Connection, 
        pinId: string, 
        isEnd: boolean
    ) {
        super(startPos);

        this.connection = connection;
        this.pinId = pinId;
        this.isEnd = isEnd;
        this.snapEndpoint = undefined;

        this.lastGridPos = Vec2.snapTo(startPos, 16);
    }

    onInitialize() {
        this.uiStore.setActiveConnection(this.connection.id);
    }

    onMove(offset: Vec2): boolean | void {

        let { domainStore, uiStore, connection, pinId } = this;

        if (!domainStore.connections.exists(connection.id)) {
            uiStore.unsetActiveConnection(connection.id);
            return false; 
        }

        //let currentGridPoint = Vec2.addVec2(Vec2.clone(this.startPos), offset);
        //let currentWorldPoint = Vec2.scale(currentGridPoint, 16);
        let currentWorldPoint = Vec2.addVec2(Vec2.clone(this.startPos), offset);
        let currentGridPoint = Vec2.snapTo(currentWorldPoint, 16);

        if (Vec2.equal(currentGridPoint, this.lastGridPos)) {
            return;
        }

        this.lastGridPos = currentGridPoint;

        let pin = connection.pins.get(pinId);
        if (!pin) {
            throw new Error(`What the fuck, man? You're trying to get a non-existent pin ${pinId}`);
        }

        uiStore.setActiveConnection(connection.id);
        uiStore.setActivePin(pinId);

        if (connection.points.length < 1) {
            connection.points.push.apply(connection.points, connection.pins);
            console.log('Pushed points. Length now:', connection.points.length);
        }
        
        if (this.isEnd) {
            // Extremely unoptimized, please replace
            let invalidEndpoints = [connection.input, connection.output]
                .filter(endpointId => Boolean(endpointId))
                .map(endpointId => domainStore.endpoints.getById(endpointId!))
                .reduce((invalidEndpoints, endpoint) => invalidEndpoints.concat(domainStore.getEndpointsOfGate(endpoint.gateId)), [] as Endpoint[])
                .map(endpoint => endpoint.id);

            let missingEndpointType = domainStore.getMissingEndpointType(connection.id);

            let endpointsAtPositions = domainStore
                .endpoints.getAll()
                .filter(endpoint => 
                    invalidEndpoints.indexOf(endpoint.id) < 0 && 
                    endpoint.type === missingEndpointType &&
                    (endpoint.type === 'output' || !domainStore.isEndpointOccupied(endpoint.id))
                )
                .map(endpoint => ({ endpoint: endpoint, pos: domainStore.getEndpointPositionForConnection(endpoint.id) }));
            let nearestPoint = endpointsAtPositions.reduce((nearest, curr) => {
                let currDist = curr ? euclidean(curr.pos.x, curr.pos.y, currentWorldPoint.x, currentWorldPoint.y) : Infinity,
                    nearestDist = nearest ? euclidean(nearest.pos.x, nearest.pos.y, currentWorldPoint.x, currentWorldPoint.y) : Infinity;
                if (currDist <= 12 && currDist < nearestDist) return curr;
                return nearest;
            }, null as EndpointAtPos | null);

            if (nearestPoint) {
                Vec2.setFrom(pin, nearestPoint.pos);
                this.snapEndpoint = nearestPoint.endpoint;
            } else {
                Vec2.setFrom(pin, currentWorldPoint);
                // replace with UIStore keyboard accessor
                //if (event.ctrlKey) drag.joint.snapTo(16);
                this.snapEndpoint = undefined;
            }
        } else {
            Vec2.setFrom(pin, currentWorldPoint);
            // replace with UIStore keyboard accessor
            //if (event.ctrlKey) drag.joint.snapTo(16);
            this.snapEndpoint = undefined;
        }
    }

    onFinalize() {
        let { connection, pinId, isEnd, snapEndpoint, domainStore, uiStore } = this;
        let pin = connection.pins.get(pinId);
        if (!pin) {
            throw new Error(`What the fuck, man? You're trying to FINALIZE a non-existent pin ${pinId}`);
        }


        if (isEnd && snapEndpoint) {
            connection.pins.delete(pinId);
            console.log(`Snapping!`);
            if (!connection.input) {
                if (snapEndpoint.type !== 'input') throw new Error(`Attempt to connect output to output!`);
                connection.input = snapEndpoint.id;
            } else {
                if (snapEndpoint.type !== 'output') throw new Error(`Attempt to connect input to input!`);
                connection.output = snapEndpoint.id;
            }
        }
        if (!domainStore.isValidConnection(connection.id)) {
            console.log('Invalid connection: removing', connection.pins);
            domainStore.connections.remove(connection.id);
        }
        uiStore.unsetActiveConnection();
    }
}