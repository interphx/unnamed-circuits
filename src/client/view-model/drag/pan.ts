import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { Vec2 } from 'client/domain/vec2';

export class PanInteraction extends DragInteraction {
    constructor(startPos: Vec2) {
        super(startPos);
    }

    onMove(offset: Vec2) {
        let { uiStore } = this;

        uiStore.panX += offset.x * uiStore.zoom;
        uiStore.panY += offset.y * uiStore.zoom;
    }
}