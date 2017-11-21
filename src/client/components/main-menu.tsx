import * as React from 'react';

import { BaseComponent } from 'client/base';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { TestCasesLevel, Level } from 'client/domain/level';
import { makeSeconds } from 'client/util/time';
import { LevelConstructor, LevelDescription } from 'client/levels';
import { LevelsRepository } from 'client/levels-repository';

function escapeRegExp(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function startsWithRegExp(start: string) {
    return new RegExp(`^${start}*`);
}

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
        let groups: [string, RegExp][] = [
            ['Tutorial', startsWithRegExp('tutorial.')],
            ['Basic gates', startsWithRegExp('simple.')],
            ['Robotics', startsWithRegExp('robotics.')],
            ['Memory', startsWithRegExp('memory.')],
            ['Conveyors', startsWithRegExp('conveyors.')],
            ['Other', /.*/ig]
        ];
        
        let groupedLevels = this.props.levelsRepo.getLevelsList().reduce(
            (accGroups, levelDescription) => {
                let levelGroup = groups.find(groupData => groupData[1].test(levelDescription.id))![0];
                if (!accGroups[levelGroup]) {
                    accGroups[levelGroup] = [];
                }
                accGroups[levelGroup].push(levelDescription);
                return accGroups;
            }, 
            {} as {[key: string]: LevelDescription[]}
        );

        return (
            <div className="main-menu">
                <div className="main-menu__title noselect">UNNAMED<br/>CIRCUITS<br/>GAME</div>
                {
                    Object.entries(groupedLevels).map(([groupName, levels]) => 
                        <div className="main-menu__levels-group">
                            <h2 className="main-menu__levels-group-title">{ groupName } ({levels.length} total)</h2>
                            {
                                levels.map(level => 
                                    <button className="main-menu__button main-menu__button--level button button--full-width button--text" 
                                            onClick={() => this.handleRunLevel(level)}
                                            key={level.id}
                                    >
                                        {level.name}
                                    </button>
                                )
                            }
                        </div>
                    )
                }
                <p>{ this.props.levelsRepo.getLevelsList().length } total</p>
            </div>
        );
    }
}