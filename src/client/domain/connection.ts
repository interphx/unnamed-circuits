import { observable } from 'mobx';

import { Vec2 } from 'client/util/vec2';
import { validateObject } from 'client/util/validation';
import { EndpointId } from 'client/domain/endpoint';

export type ConnectionId = string;
export class Connection {
    readonly id: ConnectionId;
    @observable input?: EndpointId;
    @observable output?: EndpointId;
    @observable pins = observable.array<Vec2>([]);
    @observable points = observable.array<Vec2>([]);

    constructor(id: ConnectionId) {
        this.id = id;
    }

    getEndpointsCount(): number {
        let result = 0;
        if (this.input) result += 1;
        if (this.output) result += 1;
        return result;
    }

    setPoints(newPoints: ReadonlyArray<Vec2>) {
        this.points.clear();
        this.points.push.apply(this.points, newPoints);
    }

    replaceSegment(from: Vec2, to: Vec2, newPoints: ReadonlyArray<Vec2>) {
        let fromIndex = this.points.findIndex(point => Vec2.equal(point, from)),
            toIndex = this.points.findIndex(point => Vec2.equal(point, to), undefined, fromIndex);
        this.points.splice.apply(this.points, [fromIndex, toIndex, ...newPoints]);
    }

    toPlainObject() {
        return {
            id: this.id,
            input: this.input,
            output: this.output,
            pins: this.pins.map(Vec2.toPlainObject)
        }
    }

    static toPlainObject(connection: Connection) {
        return connection.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'pins']);

        let result = new Connection(obj.id);
        result.input = obj.input;
        result.output = obj.output;
        result.pins = observable.array(obj.pins.map(Vec2.fromPlainObject));

        return result;
    }
}