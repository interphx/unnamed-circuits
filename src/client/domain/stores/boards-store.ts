import { EntityStore } from 'client/domain/stores/entity-store';
import { Board } from 'client/domain/board';
import { getRandomId } from 'shared/utils';

export class BoardsStore extends EntityStore<Board> {
    create(isMain: boolean) {
        let entity = new Board(
            getRandomId(10),
            isMain
        );
        this.add(entity);
        return entity;
    }
}