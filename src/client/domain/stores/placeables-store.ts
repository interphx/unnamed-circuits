import { EntityStore } from 'client/domain/stores/entity-store';
import { Placeable } from 'client/domain/placeable';
import { Vec2 } from 'client/util/vec2';
import { getRandomId } from 'shared/utils';
import { BoardId } from 'client/domain/board';

export class PlaceablesStore extends EntityStore<Placeable> {
    create(boardId: BoardId, pos: Vec2, size: Vec2, rotation: number) {
        let entity = new Placeable(
            getRandomId(10),
            boardId,
            Vec2.fromPlainObject(pos),
            Vec2.fromPlainObject(size)
        );
        this.add(entity);
        return entity;
    }
}