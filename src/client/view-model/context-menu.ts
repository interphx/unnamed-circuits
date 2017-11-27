import { observable, action } from 'mobx';

import { Vec2, Vec2Like } from 'client/domain/vec2';

export interface BoardContextMenuItem {
    caption: string;
    onClick: () => void;
}

export class BoardContextMenu {
    @observable pos: Vec2;
    @observable items: BoardContextMenuItem[];

    constructor(pos: Vec2Like, items: BoardContextMenuItem[]) {
        this.pos = Vec2.fromPlainObject(pos);
        this.items = observable.array<BoardContextMenuItem>(items);
    }
}