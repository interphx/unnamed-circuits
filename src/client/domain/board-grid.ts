import { observable, ObservableMap } from 'mobx';

export interface BoardGridCell {
    obstacles: number;
}

export class BoardGrid {
    @observable
    cells: ObservableMap<BoardGridCell> = observable.map({});

    get(x: number, y: number): BoardGridCell {
        let hash = `${x}:${y}`,
            value = this.cells.get(hash);
            
        if (value === undefined) {
            this.cells.set(hash, {
                obstacles: 0
            });
            return this.cells.get(hash)!;
        } else {
            return value;
        }
    }

    clear() {
        this.cells.clear();
    }
}