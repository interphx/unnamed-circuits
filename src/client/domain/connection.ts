import { observable, computed, IComputedValue } from 'mobx';

import { Vec2 } from 'client/util/vec2';
import { validateObject } from 'client/util/validation';
import { EndpointId } from 'client/domain/endpoint';
import { getRandomId } from 'shared/utils';

export interface ConnectionPin{
    readonly id: string;
    readonly pos: Vec2;
}

export type ConnectionId = string;
export class Connection {
    readonly id: ConnectionId;
    computePath: (a: Vec2, b: Vec2) => Vec2[];
    @observable input?: EndpointId;
    @observable output?: EndpointId;
    @observable pins = observable.map<ConnectionPin>({});

    @computed get segments() {
        //console.log(`Computing segments`);
        let pins = this.pins.values();
        let computePath = this.computePath;
        let results: IComputedValue<Vec2[]>[] = [];
        for (let i = 0; i < pins.length - 1; ++i) {
            let a = pins[i],
                b = pins[i + 1];
            results.push(computed(function() {
                //console.log(`Computing path segment (${i}) between ${a.x},${a.y} and ${b.x},${b.y}`);
                return computePath(a.pos, b.pos);
            }));
        }
        return results;
    }

    @computed get points() {
        //console.log(`Computing points`);
        let result = this.segments[0].get();
        for (let i = 1; i < this.segments.length; ++i) {
            result = result.concat(this.segments[i].get());
        }
        return result;
    }

    constructor(id: ConnectionId, computePath: (a: Vec2, b: Vec2) => Vec2[]) {
        this.id = id;
        this.computePath = computePath;
    }

    getEndpointsCount(): number {
        let result = 0;
        if (this.input) result += 1;
        if (this.output) result += 1;
        return result;
    }
    
    appendPin(pos: Vec2) {
        let id = getRandomId(10);
        this.pins.set(id, observable({id, pos}));
        return id;
    }

    toPlainObject() {
        console.log(`Not implemented: pin serialization in Connection.toPlainObject`);
        return {
            id: this.id,
            input: this.input,
            output: this.output,
            //pins: this.pins.map(Vec2.toPlainObject)
        }
    }

    static toPlainObject(connection: Connection) {
        return connection.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'pins']);

        throw new Error(`Not implemented: pin deserialization nad computePath passing in Connection.fromPlainObject`);

        //let result = new Connection(obj.id);
        //result.input = obj.input;
        //result.output = obj.output;
        //result.pins = observable.array(obj.pins.map(Vec2.fromPlainObject));

        //return result;
    }
}