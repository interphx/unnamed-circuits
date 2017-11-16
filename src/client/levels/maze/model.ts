import { observable } from "mobx";

import { Vec2 } from "client/domain/vec2";

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
    @observable
    playerPos: Vec2 = Vec2.fromCartesian(0, 1);
    @observable
    playerDirection: Direction = 'east';

    width: number = 11;
    height: number = 11;

    goalPos: Vec2 = Vec2.fromCartesian(10, 9);

    constructor() {
        this.data = `
###########
    #     #
### # ### #
# #   # # #
# ##### # #
#     #   #
# ### # ###
#   #     #
### #######
#          
###########
        `.trim()
        .replace(/(\n|\r|\r\n|\n\r)/ig, '')
        .split('')
        .map(c => c === '#' ? true : false);
    }

    get(x: number, y: number) {
        return this.data[y * this.width + x];
    }

    isInBounds(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    goForward() {
        let newPos = this.playerPos.clone().addVec2(Directions[this.playerDirection]);
        if (!this.get(newPos.x, newPos.y)) {
            this.playerPos.setFrom(newPos);
        }
    }

    rotateCW() {
        this.playerDirection = rotateCW(this.playerDirection);
    }

    rotateCCW() {
        this.playerDirection = rotateCCW(this.playerDirection);
    }

    isSolved() {
        return this.playerPos.isEqualTo(this.goalPos);
    }

    isFrontWall() {
        let pos = this.playerPos.clone().addVec2(Directions[this.playerDirection]);
        if (!this.isInBounds(pos.x, pos.y)) return true;
        return this.get(pos.x, pos.y);
    }

    isRightWall() {
        let pos = this.playerPos.clone().addVec2(Directions[rotateCW(this.playerDirection)]);
        if (!this.isInBounds(pos.x, pos.y)) return true;
        return this.get(pos.x, pos.y);
    }

    isLeftWall() {
        let pos = this.playerPos.clone().addVec2(Directions[rotateCCW(this.playerDirection)]);
        if (!this.isInBounds(pos.x, pos.y)) return true;
        return this.get(pos.x, pos.y);
    }

    reset() {
        this.playerPos = Vec2.fromCartesian(0, 1);
        this.playerDirection = 'east';
    }
}