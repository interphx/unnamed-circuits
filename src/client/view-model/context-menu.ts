import { observable, action } from 'mobx';

import { Vec2 } from 'client/util/vec2';

export interface BoardContextMenuItem {
    caption: string;
    onClick: () => void;
}

export class BoardContextMenu {
    @observable pos: Vec2;
    @observable items: BoardContextMenuItem[];

    constructor(pos: Vec2, items: BoardContextMenuItem[]) {
        this.pos = observable(pos);
        this.items = observable.array<BoardContextMenuItem>(items);
    }
}