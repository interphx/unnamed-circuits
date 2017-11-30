import { MovePlaceableInteraction } from 'client/view-model/drag/move-placeable';
import { Vec2 } from 'client/util/vec2';
import { Placeable } from 'client/domain/placeable';
import { Gate } from 'client/domain/gate';

export type BoxPositionChecker = (x: number, y: number, width: number, height: number) => boolean;

export class MoveGateInteraction extends MovePlaceableInteraction {
    isDroppedOnMenu: BoxPositionChecker;
    gate: Gate;

    constructor(startPos: Vec2, placeable: Placeable, gate: Gate, isDroppedOnMenu: BoxPositionChecker) {
        super(startPos, placeable);
        this.isDroppedOnMenu = isDroppedOnMenu;
        this.gate = gate;
    }

    onInitialize() {
        this.uiStore.setDraggedGate(this.gate.id);
    }

    onFinalize() {
        let { domainStore, uiStore } = this;

        uiStore.unsetDraggedGate();
        if (this.isDroppedOnMenu(this.placeable.pos.x, this.placeable.pos.y, this.placeable.size.x, this.placeable.size.y)) {
            if (this.gate.deletable) {
                domainStore.removeGate(this.gate.id);
                domainStore.placeables.remove(this.placeable.id);
            } else {
                Vec2.setFrom(this.placeable.pos, this.startPos);
            }
        }
    }
}
