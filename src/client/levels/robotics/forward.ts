import * as dedent from 'dedent';

import { Level, GateTypesList, InputDescription, OutputDescription } from 'client/domain/level';
import { Endpoint } from 'client/domain/endpoint';
import { LevelCheckResult, makeContinue, makeSuccess } from 'client/domain/level-check-result';
import { Maze } from 'client/levels/robotics/maze/maze';
import { Vec2 } from 'client/domain/vec2';
//import { Placeable } from 'client/domain/custom-object';
import { getRandomId } from 'shared/utils';
import { DomainStore } from 'client/domain/domain-store';
import { MazeCustomObject } from 'client/levels/robotics/maze/maze-custom-object';

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

    initialize(domainStore: DomainStore) {
        super.initialize(domainStore);
        let board = domainStore.boards.getAll()[0];
        let mazePlaceable = domainStore.placeables.create(
            board.id, 
            Vec2.fromCartesian(0, 200), 
            Vec2.fromCartesian(200, 200),
            0
        );
        let mazeCustomObject = domainStore.customObjects.add(
            new MazeCustomObject(
                getRandomId(10),
                mazePlaceable.id,
                this.maze
            )
        );
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