import { TestCasesLevel } from 'client/domain/level';
import { makeTicks } from 'client/util/time';

export function createMuxLevel() {
    return new TestCasesLevel([
        {
            givenOutput: { toggle: 0, a: 1, b: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { toggle: 0, a: 0, b: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { toggle: 0, a: 1, b: 1 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { toggle: 1, a: 0, b: 0 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { toggle: 1, a: 1, b: 1 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { toggle: 1, a: 0, b: 1 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
    ], { type: 'whitelist', gateTypes: ['Not', 'And', 'Or'] });
}