import { observable } from "mobx";

import { Vec2 } from "client/util/vec2";

let Directions = {
    north: Vec2.fromCartesian(0, -1),
    east: Vec2.fromCartesian(1, 0),
    south: Vec2.fromCartesian(0, 1),
    west: Vec2.fromCartesian(-1, 0)
};
let DirectionsList = ['north', 'east', 'south', 'west'] as Direction[];
type Direction = keyof typeof Directions;

function mod(a: number, b: number) {
    return ((a % b) + b) % b;
}

function rotateCW(direction: Direction): Direction {
    let index = DirectionsList.indexOf(direction);
    let newIndex = mod(index + 1, DirectionsList.length);
    return DirectionsList[newIndex];
}

function rotateCCW(direction: Direction): Direction {
    let index = DirectionsList.indexOf(direction);
    let newIndex = mod(index - 1, DirectionsList.length);
    return DirectionsList[newIndex];
}

export class Maze {
    data: boolean[];
    width: number;
    height: number;
    initialPos: Vec2;
    initialDir: Direction;
    goalPos: Vec2;

    @observable
    playerPos: Vec2;
    @observable
    playerDirection: Direction = 'east';

    constructor(width: number, height: number, initialPos: Vec2, initialDir: Direction, goalPos: Vec2, data: boolean[]) {
        this.width = width;
        this.height = height;
        if (data.length !== (width * height)) {
            throw new Error(`Attempt to create a TileMap failed: input data length = ${data.length}, expected ${width * height}`);
        }
        this.data = data;
        this.initialPos = Vec2.clone(initialPos);
        this.initialDir = initialDir;
        this.goalPos = Vec2.clone(goalPos);

        this.playerPos = Vec2.clone(initialPos);
        this.playerDirection = initialDir;
    }

    get(x: number, y: number) {
        return this.data[y * this.width + x];
    }

    isInBounds(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isGoal(x: number, y: number) {
        return x === this.goalPos.x && y === this.goalPos.y;
    }

    goForward() {
        let newPos = Vec2.addVec2(Vec2.clone(this.playerPos), Directions[this.playerDirection]);
        if (!this.get(newPos.x, newPos.y)) {
            Vec2.setFrom(this.playerPos, newPos);
        }
    }

    rotateCW() {
        this.playerDirection = rotateCW(this.playerDirection);
    }

    rotateCCW() {
        this.playerDirection = rotateCCW(this.playerDirection);
    }

    isSolved() {
        return Vec2.equal(this.playerPos, this.goalPos);
    }

    isFrontWall() {
        let pos = Vec2.addVec2(Vec2.clone(this.playerPos), Directions[this.playerDirection]);
        if (!this.isInBounds(pos.x, pos.y)) return true;
        return this.get(pos.x, pos.y);
    }

    isRightWall() {
        let pos = Vec2.addVec2(Vec2.clone(this.playerPos), Directions[rotateCW(this.playerDirection)]);
        if (!this.isInBounds(pos.x, pos.y)) return true;
        return this.get(pos.x, pos.y);
    }

    isLeftWall() {
        let pos = Vec2.addVec2(Vec2.clone(this.playerPos), Directions[rotateCCW(this.playerDirection)]);
        if (!this.isInBounds(pos.x, pos.y)) return true;
        return this.get(pos.x, pos.y);
    }

    reset() {
        this.playerPos = Vec2.clone(this.initialPos);
        this.playerDirection = this.initialDir;
    }
}