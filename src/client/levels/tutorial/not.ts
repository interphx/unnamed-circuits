import { TestCasesLevel } from 'client/domain/level';
import { makeTicks } from 'client/util/time';

export function createNotLevel() {
    return new TestCasesLevel([
        {
            givenOutput: { signal: 0 },
            expectedInput: { out: 1 },
            readDelay: makeTicks(4)
        },
        {
            givenOutput: { signal: 1 },
            expectedInput: { out: 0 },
            readDelay: makeTicks(6)
        }
    ], { type: 'whitelist', gateTypes: ['Not'] });
}