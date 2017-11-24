import { observable } from 'mobx';

import { Vec2 } from 'client/domain/vec2';
import { validateObject } from "client/util/validation";

export type PlaceableId = string;
export class Placeable {
    id: PlaceableId;
    @observable pos: Vec2;
    @observable size: Vec2;

    constructor(id: PlaceableId, pos: Vec2, size: Vec2) {
        this.id = id;
        this.pos = pos;
        this.size = size;
    }

    toPlainObject() {
        return JSON.parse(JSON.stringify(this));
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'pos', 'size']);
        return new Placeable(obj.id, Vec2.fromPlainObject(obj.pos), Vec2.fromPlainObject(obj.size));
    }
}