import * as React from 'react';

import { BaseComponent } from 'client/base';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { TestCasesLevel, Level } from 'client/domain/level';
import { makeSeconds } from 'client/util/time';
import { LevelConstructor, LevelDescription } from 'client/levels';
import { LevelsRepository } from 'client/levels-repository';

export interface MainMenuProps {
    domainStore: DomainStore;
    uiStore: UIStore;
    levelsRepo: LevelsRepository;
}

export interface MainMenuState {
    
}

export class MainMenuView extends BaseComponent<MainMenuProps, MainMenuState> {
    constructor(props: MainMenuProps) {
        super(props);
        this.state = {
            
        }
    }

    handleRunLevel(description: LevelDescription) {
        let { domainStore, uiStore } = this.props;
        domainStore.loadLevel(description.construct());
        uiStore.setCurrentLevel(description);
        uiStore.goToScreen('board');
    }

    render() {
        return (
            <div className="main-menu">
                <div className="main-menu__title noselect">UNNAMED<br/>CIRCUITS<br/>GAME</div>
                {
                    this.props.levelsRepo.getLevelsList().map(level => 
                        <button className="main-menu__button main-menu__button--level button button--full-width button--text" 
                                onClick={() => this.handleRunLevel(level)}
                                key={level.id}
                        >
                            {level.name}
                        </button>
                    )
                }
            </div>
        );
    }
}