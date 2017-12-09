import { createTransformer } from 'mobx';

import { EntityStore } from 'client/domain/stores/entity-store';
import { Gate, GateType, Custom } from 'client/domain/gate';
import { BoardId } from 'client/domain/board';
import { PlaceablesStore } from 'client/domain/stores/placeables-store';
import { getRandomId } from 'shared/utils';
import { PlaceableId } from 'client/domain/placeable';
import { BoardsStore } from 'client/domain/stores/boards-store';

export class GatesStore extends EntityStore<Gate> {
    placeablesStore: PlaceablesStore;
    boardsStore: BoardsStore;

    constructor(boardsStore: BoardsStore, placeablesStore: PlaceablesStore) {
        super();
        this.boardsStore = boardsStore;
        this.placeablesStore = placeablesStore;
    }

    create(gateType: GateType, boardId: BoardId, placeableId: PlaceableId) {
        let entity = Gate.fromTypeName(gateType, getRandomId(10), boardId);
        entity.placeableId = placeableId;
        if (entity instanceof Custom) {
            let board = this.boardsStore.create(false);
            entity.nestedBoardId = board.id;
        }
        this.add(entity);
        return entity;
    }

    remove(gateId: string) {
        let gate = this.getById(gateId);
        if (gate instanceof Custom) {
            this.boardsStore.remove(gate.nestedBoardId);
        }
        this.placeablesStore.remove(gate.placeableId);
        super.remove(gateId);
    }

    getGatesOfBoard = createTransformer((boardId: BoardId) => {
        return this.entities.values().filter(gate => gate.boardId === boardId);
    });

}