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
    pin: Vec2;
    isEnd: boolean;
    snapEndpoint?: Endpoint;
    findPath: (a: Vec2, b: Vec2) => Vec2[];

    constructor(
        startPos: Vec2, 
        connection: Connection, 
        joint: Vec2, 
        isEnd: boolean,
        findPath: (a: Vec2, b: Vec2) => Vec2[]
    ) {
        super(startPos);

        this.connection = connection;
        this.pin = joint;
        this.isEnd = isEnd;
        this.snapEndpoint = undefined;
        this.findPath = findPath;
    }

    onInitialize() {
        this.uiStore.setActiveConnection(this.connection.id);
    }

    onMove(offset: Vec2): boolean | void {
        let { domainStore, uiStore, connection, pin, findPath } = this;

        if (!domainStore.connections.exists(connection.id)) {
            uiStore.unsetActiveConnection(connection.id);
            return false; 
        }

        //let currentGridPoint = Vec2.addVec2(Vec2.clone(this.startPos), offset);
        //let currentWorldPoint = Vec2.scale(currentGridPoint, 16);
        let currentWorldPoint = Vec2.addVec2(Vec2.clone(this.startPos), offset);

        uiStore.setActiveConnection(connection.id);
        uiStore.setActiveJoint(connection.pins.indexOf(pin));

        if (connection.points.length < 1) {
            connection.points.push.apply(connection.points, connection.pins);
        }

        let pinIndex = connection.pins.findIndex(connectionPin => Vec2.equal(connectionPin, pin)),
            prevPin = (pinIndex > 0) 
                ? connection.pins[pinIndex - 1] 
                : undefined,
            nextPin = (pinIndex < connection.pins.length - 1) 
                ? connection.pins[pinIndex + 1] 
                : undefined;

        if (prevPin) {
            connection.replaceSegment(prevPin, pin, findPath(prevPin, currentWorldPoint));
        }

        if (nextPin) {
            connection.replaceSegment(pin, nextPin, findPath(currentWorldPoint, nextPin));
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
        let { connection, pin, isEnd, snapEndpoint, domainStore, uiStore } = this;
        if (isEnd && snapEndpoint) {
            connection.pins.splice(connection.pins.indexOf(pin), 1);
            if (!connection.input) {
                if (snapEndpoint.type !== 'input') throw new Error(`Attempt to connect output to output!`);
                connection.input = snapEndpoint.id;
            } else {
                if (snapEndpoint.type !== 'output') throw new Error(`Attempt to connect input to input!`);
                connection.output = snapEndpoint.id;
            }
        }
        if (!domainStore.isValidConnection(connection.id)) {
            domainStore.connections.remove(connection.id);
        }
        uiStore.unsetActiveConnection();
    }
}