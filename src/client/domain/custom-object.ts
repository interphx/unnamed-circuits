import { observable } from 'mobx';

import { Vec2 } from 'client/domain/vec2';

export type CustomObjectId = string;
export class CustomObject {
    id: CustomObjectId;
    type: string;
    @observable model: any;
    @observable pos: Vec2;

    constructor(id: CustomObjectId, type: string, model: any, pos: Vec2) {
        this.id = id;
        this.type = type;
        this.model = model;
        this.pos = pos;
    }
}