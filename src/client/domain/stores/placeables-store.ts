import { EntityStore } from 'client/domain/stores/entity-store';
import { Placeable } from 'client/domain/placeable';
import { Vec2Like, Vec2 } from 'client/domain/vec2';
import { getRandomId } from 'shared/utils';
import { BoardId } from 'client/domain/board';

export class PlaceablesStore extends EntityStore<Placeable> {
    create(boardId: BoardId, pos: Vec2Like, size: Vec2Like, rotation: number) {
        let entity = new Placeable(
            getRandomId(10),
            Vec2.fromPlainObject(pos),
            Vec2.fromPlainObject(size)
        );
        this.add(entity);
        return entity;
    }
}