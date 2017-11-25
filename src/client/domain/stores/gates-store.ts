import { createTransformer } from 'mobx';

import { EntityStore } from 'client/domain/stores/entity-store';
import { Gate, GateType } from 'client/domain/gate';
import { BoardId } from 'client/domain/board';
import { PlaceablesStore } from 'client/domain/stores/placeables-store';
import { getRandomId } from 'shared/utils';
import { PlaceableId } from 'client/domain/placeable';

export class GatesStore extends EntityStore<Gate> {
    //placeablesStore: PlaceablesStore;

    constructor(/*placeablesStore: PlaceablesStore*/) {
        super();
        //this.placeablesStore = placeablesStore;
    }

    create(gateType: GateType, boardId: BoardId, placeableId: PlaceableId) {
        let entity = Gate.fromTypeName(gateType, getRandomId(10), boardId);
        entity.placeableId = placeableId;
        this.add(entity);
        return entity;
    }

    getGatesOfBoard = createTransformer((boardId: BoardId) => {
        return this.entities.values().filter(gate => gate.boardId === boardId);
    });

}