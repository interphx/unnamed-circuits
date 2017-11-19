import * as React from 'react';

import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { LevelsRepository } from 'client/levels-repository';

interface LevelCompletedProps {
    levelName: string;
    domainStore: DomainStore;
    uiStore: UIStore;
    levelsRepo: LevelsRepository;
}

export function LevelCompletedView({ levelName, domainStore, uiStore, levelsRepo }: LevelCompletedProps) {
    let nextLevelId = uiStore.currentLevelDescription ? uiStore.currentLevelDescription.nextLevelId : undefined;
    
    return (
        <div className="level-completed">
            <p className="level-completed__text">Level Completed: { levelName }</p>
            <button className="button button--full-width button--text" onClick={() => uiStore.goToScreen('main-menu')}>Back to menu</button>
            {
                nextLevelId ?
                <button className="button button--full-width button--text" onClick={() => {
                    let description = levelsRepo.get(nextLevelId!);
                    domainStore.loadLevel(description.construct());
                    
                    uiStore.setCurrentLevel(description);
                    uiStore.goToScreen('board');
                }}>
                    Next level
                </button> : null
            }

        </div>
    );
}