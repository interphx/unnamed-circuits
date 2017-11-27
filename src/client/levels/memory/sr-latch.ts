import { TestCasesLevel } from 'client/domain/level';
import { makeTicks } from 'client/util/time';

export function createSRLatchLevel() {
    return new TestCasesLevel([
        {
            givenOutput: { on: 1, off: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { on: 0, off: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { on: 0, off: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { on: 0, off: 0 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { on: 1, off: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { on: 1, off: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { on: 0, off: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(20)
        },
        {
            givenOutput: { on: 0, off: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
    ], { type: 'whitelist', gateTypes: ['Not', 'And', 'Or'] });
}