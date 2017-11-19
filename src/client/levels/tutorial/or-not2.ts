import { TestCasesLevel } from 'client/domain/level';
import { makeTicks } from 'client/util/time';

export function createOrNot2Level() {
    return new TestCasesLevel([
        {
            givenOutput: { a: 1, b: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { a: 0, b: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { a: 0, b: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { a: 1, b: 0 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(10)
        }
    ], { type: 'whitelist', gateTypes: ['Or', 'Not'] });
}