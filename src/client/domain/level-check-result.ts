interface LevelCheckResultBase {

}

export interface Success extends LevelCheckResultBase {
    readonly type: 'success';
}

export interface Fail extends LevelCheckResultBase {
    readonly type: 'fail';
    reason?: string;
}

export interface Continue extends LevelCheckResultBase {
    readonly type: 'continue';
}

export type LevelCheckResult = Success | Fail | Continue;

let successAtom = { type: 'success' } as Success,
    continueAtom = { type: 'continue' } as Continue,
    emptyFailAtom = { type: 'fail' } as Fail;

export function makeSuccess(): Success {
    return successAtom;
}

export function makeContinue(): Continue {
    return continueAtom;
}

export function makeFail(reason?: string): Fail {
    return reason
        ? { type: 'fail', reason }
        : emptyFailAtom;
}