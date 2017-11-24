import { Vec2 } from 'client/domain/vec2';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

export abstract class DragInteraction {
    startPos: Vec2;
    domainStore: DomainStore;
    uiStore: UIStore;
    isValid: boolean = true;

    constructor(startPos: Vec2) {
        this.startPos = startPos;
    }

    initialize(domainStore: DomainStore, uiStore: UIStore) {
        this.domainStore = domainStore;
        this.uiStore = uiStore;
        this.onInitialize();
    }

    update(newPos: Vec2): boolean | undefined | void {
        if (!this.isValid) {
            throw new Error(`Attempt to update an invalid DragInteraction`);
        }
        let offset = newPos.clone().subVec2(this.startPos);
        return this.onMove(offset);
    }

    finalize() {
        if (!this.isValid) {
            throw new Error(`Attempt to finalize an invalid DragInteraction`);
        }
        this.isValid = false;
        this.onFinalize();
    }


    // Overridable methods

    onInitialize() {

    }

    onMove(offset: Vec2): boolean | undefined | void {
        return;
    }

    onFinalize() {

    }
}