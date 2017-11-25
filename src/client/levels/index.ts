import { Level } from "client/domain/level";

import { createNotLevel } from 'client/levels/tutorial/not';
import { createAndLevel } from "client/levels/tutorial/and";
import { createAnd2Level } from "client/levels/tutorial/and2";
import { createOrLevel } from "client/levels/tutorial/or";
import { createXorLevel } from "client/levels/tutorial/xor";
import { createEqLevel } from "client/levels/tutorial/eq";
import { MazeLevel } from "client/levels/robotics/maze";
import { createMuxLevel } from "client/levels/simple/multiplexer";
import { UIStore } from "client/view-model/ui-store";
import { DomainStore } from "client/domain/domain-store";
import { createAndNotLevel } from "client/levels/tutorial/and-not";
import { createOrNotLevel } from "client/levels/tutorial/or-not";
import { createAndNot2Level } from "client/levels/tutorial/and-not2";
import { createOrNot2Level } from "client/levels/tutorial/or-not2";
import { createRoboticsForwardLevel } from "client/levels/robotics/forward";
import { createRoboticsTurnsLevel } from "client/levels/robotics/turns";
import { createRoboticsManyTurnsLevel } from "client/levels/robotics/many-turns";
import { createSimplestOscillatorLevel } from "client/levels/memory/oscillator";

export type LevelConstructor = () => Level;
export interface LevelDescription {
    id: string;
    name: string;
    construct: LevelConstructor;
    getCurrentTip?: (domainStore: DomainStore, uiStore: UIStore) => string | string[] | undefined;
    nextLevelId?: string;
}

export let levels: LevelDescription[] = [
    { 
        id: 'tutorial.not', 
        name: 'NOT', 
        construct: createNotLevel, 
        nextLevelId: 'tutorial.and',
        getCurrentTip(domainStore, uiStore) {
            let lineSets = [
                ['NOT gates invert the signals.', 'Drag a NOT gate', 'from the left panel', 'to the field.'],
                ['Connect the "signal" output to', 'the input of "NOT'],
                ['Connect the "NOT" to "out"'],
                ['Click "Start" to run and', 'test the level!']
            ];

            let lines: string[] = [];

            let notGateIsOnBoard = domainStore.gates.getAll().some(gate => gate.name.toUpperCase() === 'NOT') &&
                                (!uiStore.draggedGate || domainStore.gates.getById(uiStore.draggedGate).name.toUpperCase() !== 'NOT'),
                signalIsConnectedToNot = domainStore.connections.getAll().some(connection => {
                    let gates = domainStore.getConnectionGates(connection.id);
                    if (gates.length < 2) return false;
                    return gates.some(gate => gate.name.toUpperCase() === 'NOT') &&
                        gates.some(gate => gate.name.toUpperCase() === 'SIGNAL');
                }),
                notIsConnectedToOut = domainStore.connections.getAll().some(connection => {
                    let gates = domainStore.getConnectionGates(connection.id);
                    if (gates.length < 2) return false;
                    return gates.some(gate => gate.name.toUpperCase() === 'NOT') &&
                        gates.some(gate => gate.name.toUpperCase() === 'OUT');
                }),
                levelStarted = domainStore.isCurrentLevelRunning() || domainStore.isCurrentLevelCompleted();


            if (true) {
                lines = lineSets[0];
            }
            if (notGateIsOnBoard) {
                lines = lineSets[1];
            }
            if (notGateIsOnBoard && signalIsConnectedToNot) {
                lines = lineSets[2];
            }
            if (notGateIsOnBoard && signalIsConnectedToNot && notIsConnectedToOut) {
                lines = lineSets[3];
            } 
            if (notGateIsOnBoard && signalIsConnectedToNot && notIsConnectedToOut && levelStarted) {
                lines = [];
            }

            return lines;
        }
    },
    { 
        id: 'tutorial.and', 
        name: 'AND', 
        construct: createAndLevel, 
        nextLevelId: 'tutorial.and2',
        getCurrentTip(domainStore, uiStore) {
            return [
                'AND gates emit a signal only',
                'when both outputs receive signals.',
                '',
                'Use an AND gate to turn on the "out"',
                'only when both "a" and "b" are on.',
                '',
                'When you\'re done, press "Start" to',
                'test your solution.'
            ];
        }
    },
    { 
        id: 'tutorial.and2', 
        name: 'Multiple Ands', 
        construct: createAnd2Level, 
        nextLevelId: 'tutorial.andNot',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output only',
                'when all inputs (A, B and C)',
                'are active'
            ];
        } 
    },
    { 
        id: 'tutorial.andNot', 
        name: 'AND & NOT', 
        construct: createAndNotLevel, 
        nextLevelId: 'tutorial.andNot2',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output only',
                'when A and B are both off.'
            ];
        } 
    },
    { 
        id: 'tutorial.andNot2', 
        name: 'AND & NOT (2)', 
        construct: createAndNot2Level, 
        nextLevelId: 'tutorial.or',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output only',
                'when A and B are NOT simultaneously on',
                '(so, one or both should be off)'
            ];
        } 
    },
    { 
        id: 'tutorial.or', 
        name: 'OR', 
        construct: createOrLevel, 
        nextLevelId: 'tutorial.orNot',
        getCurrentTip(domainStore, uiStore) {
            return [
                'OR gates emit a signal when',
                'one or more inputs are active.',
                '',
                'Try to use it here.'
            ];
        }
    },
    { 
        id: 'tutorial.orNot', 
        name: 'OR & NOT', 
        construct: createOrNotLevel, 
        nextLevelId: 'tutorial.orNot2',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output when',
                'one or more inputs are off.'
            ];
        }
    },
    { 
        id: 'tutorial.orNot2', 
        name: 'OR & NOT (2)', 
        construct: createOrNot2Level, 
        nextLevelId: 'simple.eq',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output when',
                'both inputs are off.'
            ];
        }
    },
    
    { 
        id: 'simple.eq', 
        name: 'Equals', 
        construct: createEqLevel, 
        nextLevelId: 'simple.xor',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Emit a signal only when A = B',
                '(both on or both off)'
            ];
        }
    },
    { 
        id: 'simple.xor', 
        name: 'XOR', 
        construct: createXorLevel, 
        nextLevelId: 'simple.mux',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output only',
                'when A and B are different',
                '(A is off and B is on or vice-versa)'
            ];
        }
    },
    { 
        id: 'simple.mux', 
        name: 'Multiplexer', 
        construct: createMuxLevel, 
        nextLevelId: 'robotics.forward',
        getCurrentTip(domainStore, uiStore) {
            return [
                'When toggle is off, the input',
                'must be equal to A.',
                'When toggle is on, the input',
                'must be equal to B'
            ];
        }
    },


    { 
        id: 'robotics.forward', 
        name: 'Forward', 
        construct: createRoboticsForwardLevel,
        nextLevelId: 'robotics.turns',
        getCurrentTip(domainStore, uiStore) {
            return [
                'The robot reads and executes',
                'your commands every half a second.',
                'Try to make it reach the green goal.'
            ];
        }
    },
    { 
        id: 'robotics.turns', 
        name: 'Turns', 
        construct: createRoboticsTurnsLevel,
        nextLevelId: 'robotics.manyTurns',
        getCurrentTip(domainStore, uiStore) {
            return [
                'The front wall detector activates',
                'when there\'s a wall directly',
                'in front of the robot.',
                '',
                'Make the robot reach the green goal.'
            ];
        }
    },
    { 
        id: 'robotics.manyTurns', 
        name: 'Many Turns', 
        construct: createRoboticsManyTurnsLevel,
        nextLevelId: 'robotics.maze',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Now you have detectors for',
                'right and left walls as well.',
                'You can also turn in both',
                'directions',
                '',
                'Make the robot reach the green goal.'
            ];
        }
    },
    { 
        id: 'robotics.maze', 
        name: 'Maze', 
        construct: () => new MazeLevel,
        nextLevelId: 'memory.oscillator',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Guide a robot through a maze!',
                'It reads and executes your',
                'commands every 0.5 seconds',
                'when the level is running.',
                '',
                'Use right, left and front',
                'wall detectors to make decisions.'
            ];
        }
    },

    { 
        id: 'memory.oscillator', 
        name: 'Simplest Oscillator', 
        construct: createSimplestOscillatorLevel,
        getCurrentTip(domainStore, uiStore) {
            return [
                'Try to make the output change',
                'as fast as possible!'
            ];
        }
    },
];