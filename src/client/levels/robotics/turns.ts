import * as dedent from 'dedent';

import { Level, InputDescription, OutputDescription, GateTypesList } from 'client/domain/level';
import { Endpoint } from 'client/domain/endpoint';
import { LevelCheckResult, makeContinue, makeSuccess } from 'client/domain/level-check-result';
import { Maze } from 'client/levels/robotics/maze/model';
import { Vec2 } from 'client/domain/vec2';
import { CustomObject } from 'client/domain/custom-object';
import { getRandomId } from 'shared/utils';

export class RoboticsTurnsLevel extends Level {
    maze: Maze = new Maze(
        9, 6,
        Vec2.fromCartesian(0, 1), 'east',
        Vec2.fromCartesian(4, 4),
        dedent`
        #########
                #
        ####### #
        ####### #
        ####    #
        #########
        `.trim()
        .replace(/(\n|\r|\r\n|\n\r)/ig, '')
        .split('')
        .map(c => c === '#' ? true : false)
    );

    counter = 0;

    updateAndCheck(dtSeconds: number, currentTimeSeconds: number, inputs: Endpoint[], outputs: Endpoint[]): LevelCheckResult {
        outputs.find(output => output.tag === 'front-wall')!.value = this.maze.isFrontWall() ? 1 : 0;

        this.counter += 1;
        if (this.counter > 10) {
            this.counter = 0;

            let shouldRotateCW = inputs.find(input => input.tag === 'rot-cw')!.value > 0.5,
                shouldMoveForward = inputs.find(input => input.tag === 'forward')!.value > 0.5;
            
            if (shouldRotateCW) this.maze.rotateCW();
            if (shouldMoveForward) this.maze.goForward();

            if (this.maze.isSolved()) {
                return makeSuccess();
            }
        }
        return makeContinue();
    }

    getInitialInputs(): InputDescription[] {
        return [
            {name: 'Rotate ↷', tag: 'rot-cw'},
            {name: 'Move ↑', tag: 'forward'}
        ];
    }

    getInitialOutputs(): OutputDescription[] {
        return [
            {name: 'Front wall', tag: 'front-wall'}
        ];
    }

    getCustomObjects(): CustomObject[] {
        return [
            {
                id: getRandomId(10),
                type: 'Maze',
                pos: Vec2.fromCartesian(0, 200),
                model: this.maze
            }
        ];
    }

    reset(): void {
        this.counter = 0;
        this.maze.reset();
    }

    getAvailableGateTypes(): GateTypesList {
        return {
            type: 'whitelist',
            gateTypes: ['And', 'Not']
        };
    }
}

export function createRoboticsTurnsLevel() {
    return new RoboticsTurnsLevel();
}