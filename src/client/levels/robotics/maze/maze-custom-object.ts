import { CustomObject, CustomObjectId } from 'client/domain/custom';
import { Maze } from 'client/levels/robotics/maze/maze';
import { PlaceableId } from 'client/domain/placeable';

export class MazeCustomObject extends CustomObject {
    maze: Maze;

    constructor(id: CustomObjectId, placeableId: PlaceableId, maze: Maze) {
        super(id, 'maze', placeableId);
        this.maze = maze;
    }
}