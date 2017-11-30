import { Vec2 } from 'client/util/vec2';
import { Placeable } from 'client/domain/placeable';
import { Connection } from 'client/domain/connection';
import { Endpoint } from 'client/domain/endpoint';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { DragInteraction } from 'client/view-model/drag/drag-interaction';


export class DragManager {
    interactions: DragInteraction[] = [];

    domainStore: DomainStore;
    uiStore: UIStore;

    constructor(
        domainStore: DomainStore, 
        uiStore: UIStore
    ) {
        this.domainStore = domainStore;
        this.uiStore = uiStore;
    }

    startDrag(interaction: DragInteraction) {
        interaction.initialize(this.domainStore, this.uiStore);
        this.interactions.push(interaction);
    }

    update(newPos: Vec2) {
        let ended: DragInteraction[] = [];
        for (let interaction of this.interactions) {
            if (interaction.update(newPos) === false) {
                ended.push(interaction);
            }
        }
        for (let interaction of ended) {
            this.endDrag(interaction);
        }
    }

    endDrag(interaction: DragInteraction) {
        let index = this.interactions.indexOf(interaction);
        this.interactions.splice(index, 1);
        interaction.finalize();
    }

    endAll() {
        for (let interaction of this.interactions) {
            interaction.finalize();
        }
        this.interactions.length = 0;
    }
}