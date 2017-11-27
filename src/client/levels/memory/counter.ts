import { TestCasesLevel } from 'client/domain/level';
import { makeTicks } from 'client/util/time';

export function createCounterLevel() {
    return new TestCasesLevel([
        {
            givenOutput: { signal: 0, },
            expectedInput: { 1: 0, 2: 0, 3: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { signal: 1, },
            expectedInput: { 1: 1, 2: 0, 3: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { signal: 0, },
            expectedInput: { 1: 1, 2: 0, 3: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { signal: 1, },
            expectedInput: { 1: 1, 2: 1, 3: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { signal: 0, },
            expectedInput: { 1: 1, 2: 1, 3: 0 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { signal: 1, },
            expectedInput: { 1: 1, 2: 1, 3: 1 },
            readDelay: makeTicks(10)
        },
        {
            givenOutput: { signal: 0, },
            expectedInput: { 1: 1, 2: 1, 3: 1 },
            readDelay: makeTicks(20)
        },
    ], { type: 'whitelist', gateTypes: ['Not', 'And', 'Or'] });
}