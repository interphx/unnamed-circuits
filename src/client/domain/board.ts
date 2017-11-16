import { validateObject } from "client/util/validation";

export type BoardId = string;
export class Board {
    readonly id: BoardId;

    constructor(id: BoardId) {
        this.id = id;
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
        validateObject(obj, ['id']);
        return new Board(obj.id);
    }
}