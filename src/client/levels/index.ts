import { Level } from "client/domain/level";

import { createNotLevel } from 'client/levels/tutorial/not';
import { createAndLevel } from "client/levels/tutorial/and";
import { createAnd2Level } from "client/levels/tutorial/and2";
import { createOrLevel } from "client/levels/tutorial/or";
import { createXorLevel } from "client/levels/tutorial/xor";
import { createEqLevel } from "client/levels/tutorial/eq";
import { MazeLevel } from "client/levels/maze/level";
import { createMuxLevel } from "client/levels/simple/multiplexer";

export type LevelConstructor = () => Level;
export interface LevelDescription {
    id: string;
    name: string;
    construct: LevelConstructor;
    nextLevelId?: string;
}

export let levels: LevelDescription[] = [
    { id: 'tutorial.not', name: 'NOT', construct: createNotLevel, nextLevelId: 'tutorial.and' },
    { id: 'tutorial.and', name: 'AND', construct: createAndLevel, nextLevelId: 'tutorial.and2' },
    { id: 'tutorial.and2', name: 'Multiple Ands', construct: createAnd2Level, nextLevelId: 'tutorial.or' },
    { id: 'tutorial.or', name: 'OR', construct: createOrLevel, nextLevelId: 'tutorial.xor' },
    { id: 'tutorial.xor', name: 'XOR', construct: createXorLevel, nextLevelId: 'tutorial.eq' },
    { id: 'tutorial.eq', name: 'Equals', construct: createEqLevel, nextLevelId: 'simple.mux' },

    { id: 'simple.mux', name: 'Multiplexer', construct: createMuxLevel, nextLevelId: 'robotics.maze'},

    { id: 'robotics.maze', name: 'Maze', construct: () => new MazeLevel }
];