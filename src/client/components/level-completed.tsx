import * as React from 'react';

import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

interface LevelCompletedProps {
    levelName: string;
    domainStore: DomainStore;
    uiStore: UIStore;
}

export function LevelCompletedView({ levelName, domainStore, uiStore }: LevelCompletedProps) {


    return (
        <div className="level-completed">
            <p className="level-completed__text">Level Completed!</p>
            <button className="button button--full-width button--text" onClick={() => uiStore.goToScreen('main-menu')}>Back to menu</button>
            <button className="button button--full-width button--text" onClick={() => {}}>Next level</button>
        </div>
    );
}