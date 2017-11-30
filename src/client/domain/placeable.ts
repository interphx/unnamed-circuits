import { observable } from 'mobx';

import { Vec2 } from 'client/util/vec2';
import { validateObject } from "client/util/validation";
import { BoardId } from 'client/domain/board';

export type PlaceableId = string;
export class Placeable {
    id: PlaceableId;
    @observable boardId: BoardId;
    @observable pos: Vec2;
    @observable size: Vec2;

    constructor(id: PlaceableId, boardId: BoardId, pos: Vec2, size: Vec2) {
        this.id = id;
        this.boardId = boardId;
        this.pos = observable(pos);
        this.size = observable(size);
    }

    toPlainObject() {
        return JSON.parse(JSON.stringify(this));
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'boardId', 'pos', 'size']);
        return new Placeable(obj.id, obj.boardId, Vec2.fromPlainObject(obj.pos), Vec2.fromPlainObject(obj.size));
    }
}