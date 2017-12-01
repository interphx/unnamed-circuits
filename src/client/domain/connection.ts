import { observable } from 'mobx';

import { Vec2 } from 'client/util/vec2';
import { validateObject } from 'client/util/validation';
import { EndpointId } from 'client/domain/endpoint';
import { getRandomId } from 'shared/utils';

export interface ConnectionPin extends Vec2 {
    id: string;
    x: number;
    y: number;
}

interface Point {
    type: 'Point';
    pos: Vec2;
}

interface PinRef {
    type: 'PinRef';
    pinId: string;
}

export type ConnectionId = string;
export class Connection {
    readonly id: ConnectionId;
    @observable input?: EndpointId;
    @observable output?: EndpointId;
    @observable pins = observable.map<ConnectionPin>({});
    @observable points = observable.array<Point | PinRef>([]);

    constructor(id: ConnectionId) {
        this.id = id;
    }

    getEndpointsCount(): number {
        let result = 0;
        if (this.input) result += 1;
        if (this.output) result += 1;
        return result;
    }
    
    appendPin(pos: Vec2) {
        let id = getRandomId(10);
        this.pins.set(id, {
            id, 
            x: pos.x, 
            y: pos.y
        });
        this.points.push({
            type: 'PinRef',
            pinId: id
        });
    }

    setPoints(newPoints: ReadonlyArray<Vec2>) {
        this.points.clear();
        this.points.push.apply(this.points, newPoints);
    }

    replaceSegment(fromPin: string, toPing: string, newPoints: ReadonlyArray<Vec2>) {
        let fromIndex = this.points.findIndex(,
            toIndex = this.points.indexOf(this.pins[to]);
            console.log(fromIndex, toIndex);
        this.points.splice.apply(this.points, [fromIndex, toIndex - fromIndex, ...newPoints]);
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