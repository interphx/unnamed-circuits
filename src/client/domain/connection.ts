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
    //@observable
    //joints = observable.array<Vec2>([]);
    @observable
    points = observable.array<Vec2>([]);

    constructor(id: ConnectionId) {
        this.id = id;
    }

    getEndpointsCount(): number {
        let result = 0;
        if (this.endpointA) result += 1;
        if (this.endpointB) result += 1;
        return result;
    }

    toPlainObject() {
        return {
            id: this.id,
            endpointA: this.endpointA,
            endpointB: this.endpointB,
            points: this.points.map(Vec2.toPlainObject)
        }
    }

    static toPlainObject(connection: Connection) {
        return connection.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'endpointA', 'endpointB', 'points']);

        let result = new Connection(obj.id);
        result.endpointA = obj.endpointA;
        result.endpointB = obj.endpointB;
        result.points = observable.array(obj.points.map(Vec2.fromPlainObject));

        return result;
    }
}