import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { Vec2 } from 'client/domain/vec2';
import { Placeable } from 'client/domain/placeable';

export class MovePlaceableInteraction extends DragInteraction {
    placeable: Placeable;
    placeableStartPos: Vec2;

    constructor(startPos: Vec2, placeable: Placeable) {
        super(startPos);
        this.placeable = placeable;
        this.placeableStartPos = placeable.pos.clone();
    }

    onMove(offset: Vec2) {
        this.placeable.pos.setFrom(this.placeableStartPos.clone().addVec2(offset));
    }
}
