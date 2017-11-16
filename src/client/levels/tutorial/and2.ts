import { TestCasesLevel } from 'client/domain/level';
import { makeTicks } from 'client/util/time';

export function createAnd2Level() {
    return new TestCasesLevel([
        {
            givenOutput: { a: 1, b: 1, c: 1 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(20)
        },
        {
            givenOutput: { a: 1, b: 0, c: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(20)
        },
        {
            givenOutput: { a: 0, b: 1, c: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(20)
        },
        {
            givenOutput: { a: 1, b: 1, c: 0 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(20)
        },
        {
            givenOutput: { a: 0, b: 0, c: 0 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(20)
        },
        {
            givenOutput: { a: 1, b: 0, c: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(20)
        }
    ], { type: 'whitelist', gateTypes: ['And'] });
}