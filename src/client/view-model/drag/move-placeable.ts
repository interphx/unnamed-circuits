import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { Vec2 } from 'client/util/vec2';
import { Placeable } from 'client/domain/placeable';

export class MovePlaceableInteraction extends DragInteraction {
    placeable: Placeable;
    placeableStartPos: Vec2;

    constructor(startPos: Vec2, placeable: Placeable) {
        super(startPos);
        this.placeable = placeable;
        this.placeableStartPos = Vec2.clone(placeable.pos);
    }

    onMove(offset: Vec2) {
        Vec2.setFrom(this.placeable.pos, Vec2.addVec2(Vec2.clone(this.placeableStartPos), offset));
        Vec2.snapTo(this.placeable.pos, 16);
    }
}
