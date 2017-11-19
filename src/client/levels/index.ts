import { Level } from "client/domain/level";

import { createNotLevel } from 'client/levels/tutorial/not';
import { createAndLevel } from "client/levels/tutorial/and";
import { createAnd2Level } from "client/levels/tutorial/and2";
import { createOrLevel } from "client/levels/tutorial/or";
import { createXorLevel } from "client/levels/tutorial/xor";
import { createEqLevel } from "client/levels/tutorial/eq";
import { MazeLevel } from "client/levels/maze/level";
import { createMuxLevel } from "client/levels/simple/multiplexer";
import { UIStore } from "client/view-model/ui-store";
import { DomainStore } from "client/domain/domain-store";

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

            let notGateIsOnBoard = domainStore.getAllGates().some(gate => gate.name.toUpperCase() === 'NOT') &&
                                (!uiStore.draggedGate || domainStore.getGateById(uiStore.draggedGate).name.toUpperCase() !== 'NOT'),
                signalIsConnectedToNot = domainStore.getAllConnections().some(connection => {
                    let gates = domainStore.getConnectionGates(connection.id);
                    if (gates.length < 2) return false;
                    return gates.some(gate => gate.name.toUpperCase() === 'NOT') &&
                        gates.some(gate => gate.name.toUpperCase() === 'SIGNAL');
                }),
                notIsConnectedToOut = domainStore.getAllConnections().some(connection => {
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
        nextLevelId: 'tutorial.or',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output only',
                'when all inputs (A, B and C)',
                'are active'
            ];
        } 
    },
    { 
        id: 'tutorial.or', 
        name: 'OR', 
        construct: createOrLevel, 
        nextLevelId: 'tutorial.xor',
        getCurrentTip(domainStore, uiStore) {
            return [
                'OR gates emit a signal when',
                'one or more inputs receive signals.',
                '',
                'Try to use it here.'
            ];
        }
    },
    { 
        id: 'tutorial.xor', 
        name: 'XOR', 
        construct: createXorLevel, 
        nextLevelId: 'tutorial.eq',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Activate the output only',
                'when A and B are different',
                '(A is off and B is on or vice-versa)'
            ];
        }
    },
    { 
        id: 'tutorial.eq', 
        name: 'Equals', 
        construct: createEqLevel, 
        nextLevelId: 'simple.mux',
        getCurrentTip(domainStore, uiStore) {
            return [
                'Emit a signal only when A = B',
                '(both on or both off)'
            ];
        }
    },

    { 
        id: 'simple.mux', 
        name: 'Multiplexer', 
        construct: createMuxLevel, 
        nextLevelId: 'robotics.maze',
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
        id: 'robotics.maze', 
        name: 'Maze', 
        construct: () => new MazeLevel,
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
    }
];