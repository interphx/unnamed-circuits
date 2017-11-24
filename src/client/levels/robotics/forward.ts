import * as dedent from 'dedent';

import { Level, GateTypesList, InputDescription, OutputDescription } from 'client/domain/level';
import { Endpoint } from 'client/domain/endpoint';
import { LevelCheckResult, makeContinue, makeSuccess } from 'client/domain/level-check-result';
import { Maze } from 'client/levels/robotics/maze/model';
import { Vec2 } from 'client/domain/vec2';
//import { Placeable } from 'client/domain/custom-object';
import { getRandomId } from 'shared/utils';

export class RoboticsForwardLevel extends Level {
    maze: Maze = new Maze(
        11, 3,
        Vec2.fromCartesian(0, 1), 'east',
        Vec2.fromCartesian(9, 1),
        dedent`
        ###########
                  #
        ###########
        `.trim()
        .replace(/(\n|\r|\r\n|\n\r)/ig, '')
        .split('')
        .map(c => c === '#' ? true : false)
    );

    counter = 0;

    updateAndCheck(dtSeconds: number, currentTimeSeconds: number, inputs: Endpoint[], outputs: Endpoint[]): LevelCheckResult {
        this.counter += 1;
        if (this.counter > 10) {
            this.counter = 0;

            let shouldMoveForward = inputs.find(input => input.tag === 'forward')!.value > 0.5;

            if (shouldMoveForward) this.maze.goForward();

            if (this.maze.isSolved()) {
                return makeSuccess();
            }
        }
        return makeContinue();
    }

    getInitialInputs(): InputDescription[] {
        return [
            {name: 'Move ↑', tag: 'forward'}
        ];
    }

    getInitialOutputs(): OutputDescription[] {
        return [
        ];
    }

    initialize() {
        // TODO: Create maze
        /*return [
            {
                id: getRandomId(10),
                type: 'Maze',
                pos: Vec2.fromCartesian(0, 200),
                model: this.maze
            }
        ];*/
    }

    reset(): void {
        this.counter = 0;
        this.maze.reset();
    }

    getAvailableGateTypes(): GateTypesList {
        return {
            type: 'whitelist',
            gateTypes: ['Not']
        };
    }
}

export function createRoboticsForwardLevel() {
    return new RoboticsForwardLevel();
}