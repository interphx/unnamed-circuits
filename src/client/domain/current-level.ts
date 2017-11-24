import { Level } from 'client/domain/level';
import { LevelDescription } from 'client/levels';
import { LevelCheckResult } from 'client/domain/level-check-result';
import { GateType, GateTypes } from 'client/domain/gate';

export class CurrentLevel {
    level?: Level;
    description?: LevelDescription;
    state?: LevelCheckResult;

    constructor() {

    }

    isRunning() {
        return Boolean(this.state && this.state.type === 'continue');
    }

    isCompleted() {
        return Boolean(this.state && this.state.type === 'success');
    }

    isFailed() {
        return Boolean(this.state && this.state.type === 'fail');
    }

    isLoaded() {
        return Boolean(this.level && this.description);
    }

    getState() {
        return this.state;
    }
}