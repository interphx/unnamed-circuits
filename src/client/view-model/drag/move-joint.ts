import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { Vec2 } from 'client/domain/vec2';
import { Connection } from 'client/domain/connection';
import { Endpoint } from 'client/domain/endpoint';

interface EndpointAtPos {
    endpoint: Endpoint;
    pos: Vec2;
}

export class MoveJoint extends DragInteraction {

    connection: Connection;
    joint: Vec2;
    isEnd: boolean;
    snapEndpoint?: Endpoint;

    constructor(startPos: Vec2, connection: Connection, joint: Vec2, isEnd: boolean) {
        super(startPos);

        this.connection = connection;
        this.joint = joint;
        this.isEnd = isEnd;
        this.snapEndpoint = undefined;
    }

    onInitialize() {
        this.uiStore.setActiveConnection(this.connection.id);
    }

    onMove(offset: Vec2): boolean | void {
        let { domainStore, uiStore, connection, joint } = this;

        if (!domainStore.connections.exists(connection.id)) {
            uiStore.unsetActiveConnection(connection.id);
            return false; 
        }

        let candidatePoint = this.startPos.clone().addVec2(offset);

        uiStore.setActiveConnection(connection.id);
        uiStore.setActiveJoint(connection.points.indexOf(joint));
        
        if (this.isEnd) {
            // Extremely unoptimized, please replace
            let invalidEndpoints = [connection.endpointA, connection.endpointB]
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
                let currDist = curr ? curr.pos.distanceTo(candidatePoint) : Infinity,
                    nearestDist = nearest ? nearest.pos.distanceTo(candidatePoint): Infinity;
                if (currDist <= 12 && currDist < nearestDist) return curr;
                return nearest;
            }, null as EndpointAtPos | null);

            if (nearestPoint) {
                joint.setFrom(nearestPoint.pos);
                this.snapEndpoint = nearestPoint.endpoint;
            } else {
                joint.setFrom(candidatePoint);
                // replace with UIStore keyboard accessor
                //if (event.ctrlKey) drag.joint.snapTo(16);
                this.snapEndpoint = undefined;
            }
        } else {
            joint.setFrom(candidatePoint);
            // replace with UIStore keyboard accessor
            //if (event.ctrlKey) drag.joint.snapTo(16);
            this.snapEndpoint = undefined;
        }
    }

    onFinalize() {
        let { connection, joint, isEnd, snapEndpoint, domainStore, uiStore } = this;
        if (isEnd && snapEndpoint) {
            connection.points.splice(connection.points.indexOf(joint), 1);
            if (!connection.endpointA) {
                connection.endpointA = snapEndpoint.id;
            } else {
                connection.endpointB = snapEndpoint.id;
            }
        }
        if (!domainStore.isValidConnection(connection.id)) {
            domainStore.connections.remove(connection.id);
        }
        uiStore.unsetActiveConnection();
    }
}