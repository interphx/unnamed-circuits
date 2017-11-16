import { observable } from 'mobx';

import { Vec2 } from 'client/domain/vec2';
import { validateObject } from 'client/util/validation';
import { EndpointId } from 'client/domain/endpoint';

export type ConnectionId = string;
export class Connection {
    readonly id: ConnectionId;
    @observable
    endpointA: EndpointId | null;
    @observable
    endpointB: EndpointId | null;
    @observable
    joints = observable.array<Vec2>([]);

    constructor(id: ConnectionId) {
        this.id = id;
    }

    toPlainObject() {
        return {
            id: this.id,
            endpointA: this.endpointA,
            endpointB: this.endpointB,
            intermediatePoints: this.joints.map(Vec2.toPlainObject)
        }
    }

    static toPlainObject(connection: Connection) {
        return connection.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'endpointA', 'endpointB', 'intermediatePoints']);

        let result = new Connection(obj.id);
        result.endpointA = obj.endpointA;
        result.endpointB = obj.endpointB;
        result.joints = observable.array(obj.intermediatePoints.map(Vec2.fromPlainObject));

        return result;
    }
}