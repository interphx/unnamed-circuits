import * as React from 'react';

import { BaseComponent } from 'client/base';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { TestCasesLevel, Level } from 'client/domain/level';
import { makeSeconds } from 'client/util/time';

// Levels
import { MazeLevel } from 'client/levels/maze/level';
import { createNotLevel } from 'client/levels/tutorial/not';
import { createAndLevel } from 'client/levels/tutorial/and';
import { createAnd2Level } from 'client/levels/tutorial/and2';
import { createOrLevel } from 'client/levels/tutorial/or';
import { createXorLevel } from 'client/levels/tutorial/xor';
import { createEqLevel } from 'client/levels/tutorial/eq';

export interface MainMenuProps {
    domainStore: DomainStore;
    uiStore: UIStore;
}

export interface MainMenuState {
    
}

export class MainMenuView extends BaseComponent<MainMenuProps, MainMenuState> {
    levels = new Map<string, () => Level>([
        ['Not', createNotLevel],
        ['And', createAndLevel],
        ['And2', createAnd2Level],
        ['Or', createOrLevel],
        ['Xor', createXorLevel],
        ['Eq', createEqLevel],
        ['Maze', () => new MazeLevel()]
    ]);

    constructor(props: MainMenuProps) {
        super(props);
        this.state = {
            
        }
    }

    handleRunLevel(levelName: string) {
        let { domainStore, uiStore } = this.props;
        domainStore.loadLevel(this.levels.get(levelName)!());
        uiStore.goToScreen('board');
    }

    render() {
        return (
            <div className="main-menu">
                <div className="main-menu__title noselect">UNNAMED<br/>CIRCUITS<br/>GAME</div>
                {
                    Array.from(this.levels.keys()).map(levelName => 
                        <button className="main-menu__button main-menu__button--level button button--full-width button--text" 
                                onClick={() => this.handleRunLevel(levelName)}
                                key={levelName}
                        >
                            {levelName}
                        </button>
                    )
                }
            </div>
        );
    }
}