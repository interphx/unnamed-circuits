import * as React from 'react';

import { BaseComponent } from 'client/base';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

export interface LevelMenuProps {
    domainStore: DomainStore;
    uiStore: UIStore;
}

export interface LevelMenuState {
    
}

export class LevelMenuView extends BaseComponent<LevelMenuProps, LevelMenuState> {
    constructor(props: LevelMenuProps) {
        super(props);
        this.state = {
            
        }
    }

    handleResume() {
        this.props.uiStore.hideLevelMenu();
    }

    handleRestart() {
        this.props.domainStore.restartLevel();
        this.props.uiStore.hideLevelMenu();
    }

    handleExit() {
        this.props.uiStore.goToScreen('main-menu');
    }

    render() {
        return (
            <div className="level-menu">
                <button className="level-menu__resume button button--full-width button--text" onClick={this.handleResume}>Resume</button>
                <button className="level-menu__restart button button--full-width button--text" onClick={this.handleRestart}>Restart</button>
                <button className="level-menu__exit button button--full-width button--text" onClick={this.handleExit}>Exit to main menu</button>
            </div>
        );
    }
}