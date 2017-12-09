import { validateObject } from "client/util/validation";

export type BoardId = string;
export class Board {
    readonly id: BoardId;
    readonly isMain: boolean;

    constructor(id: BoardId, isMain: boolean) {
        this.id = id;
        this.isMain = isMain;
    }

    toPlainObject() {
        return {
            id: this.id
        };
    }

    static toPlainObject(board: Board) {
        return board.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'isMain']);
        return new Board(obj.id, obj.isMain);
    }
}