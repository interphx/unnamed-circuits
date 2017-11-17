import { Level } from 'client/domain/level';
import { LevelConstructor, LevelDescription } from "client/levels";

export class LevelsRepository {
    levelsMap: Map<string, LevelDescription> = new Map();

    constructor() {

    }

    register(description: LevelDescription) {
        this.levelsMap.set(description.id, description);
    }

    get(id: string): LevelDescription {
        if (!this.levelsMap.has(id)) {
            throw new Error(`Attempt to get an unknown level: ${id}`);
        }
        return this.levelsMap.get(id)!;
    }

    getConstructor(id: string): LevelConstructor {
        return this.get(id).construct;
    }

    getLevelsList(): LevelDescription[] {
        return Array.from(this.levelsMap.values());
    }

    getNextLevelId(id: string): string | undefined {
        return this.get(id).nextLevelId;
    }
}