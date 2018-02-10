import { Vec2 } from 'client/util/vec2';
import { UIPos } from 'client/view-model/ui-pos';
import { observable } from 'mobx';

export class UIArrow {
    id: string;
    @observable startPos: UIPos;
    @observable endPos: UIPos;
    @observable text?: string;

    constructor(id: string, startPos: UIPos, endPos: UIPos, text?: string) {
        this.id = id;
        this.startPos = startPos;
        this.endPos = endPos;
        this.text = text;
    }
}