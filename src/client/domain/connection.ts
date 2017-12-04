import { observable, computed, IComputedValue } from 'mobx';

import { Vec2 } from 'client/util/vec2';
import { validateObject } from 'client/util/validation';
import { EndpointId } from 'client/domain/endpoint';
import { getRandomId } from 'shared/utils';

type ConnectionSegmentType = 'path' | 'straight';

interface ConnectionPin {
    readonly id: string;
    readonly pos: Vec2;
    nextSegmentType: ConnectionSegmentType;
}

export type ConnectionId = string;
export class Connection {
    readonly id: ConnectionId;
    computePath: (a: Vec2, b: Vec2) => Vec2[];
    @observable input?: EndpointId;
    @observable output?: EndpointId;
    @observable protected pins = observable.map<ConnectionPin>({});

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
                if (a.nextSegmentType === 'path') {
                    return computePath(a.pos, b.pos);
                } else if (a.nextSegmentType === 'straight') {
                    return [a.pos, b.pos];
                } else {
                    throw new Error(`Unknown segment type: ${a.nextSegmentType}`);
                }
            }));
        }
        return results;
    }

    @computed get points(): ReadonlyArray<Vec2> {
        if (this.segments.length < 1) {
            return [];
        }
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
    
    appendComputedPin(pos: Vec2 | IComputedValue<Vec2>, type: ConnectionSegmentType = 'path') {
        let id = getRandomId(10);
        this.pins.set(id, observable({
            id, pos: 
            pos as any, 
            nextSegmentType: type
        }));
        return id;
    }

    removePin(pinId: string) {
        this.pins.delete(pinId);
    }

    setPinNextSegmentType(pinId: string, newType: ConnectionSegmentType) {
        this.pins.get(pinId)!.nextSegmentType = newType;
    }

    setPinPos(pinId: string, newPos: Vec2) {
        let pos = this.pins.get(pinId)!.pos;
        pos.x = newPos.x;
        pos.y = newPos.y;
    }

    getPinsCount() {
        return this.pins.size;
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