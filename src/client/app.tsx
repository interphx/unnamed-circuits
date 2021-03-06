import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as classnames from 'classnames';
import { observer } from 'mobx-react';
import * as pako from 'pako';
import * as Modal from 'react-modal';

import { getRandomId } from 'shared/utils';
import { UIStore } from 'client/view-model/ui-store';
import { DomainStore } from 'client/domain/domain-store';
import { BaseComponent } from 'client/base';
import { BoardView } from 'client/components/board';
import { storageKey } from 'client/storage';
import { LevelCompletedView } from 'client/components/level-completed';
import { LevelMenuView } from 'client/components/level-menu';
import { MainMenuView } from 'client/components/main-menu';
import { MazeView } from 'client/levels/robotics/maze/view';
import { Maze } from 'client/levels/robotics/maze/maze';
import { CustomViewsRepository, CustomObjectReactView } from 'client/custom-views-repository';
import { LevelsRepository } from "client/levels-repository";
import { levels } from "client/levels";

let modalClasses = {base: 'modal', afterOpen: 'model--after-open', beforeClose: 'modal--before-close'};
let modalOverlayClasses = {base: 'modal-overlay', afterOpen: 'model-overlay--after-open', beforeClose: 'modal-overlay--before-close'};


interface Props {
    domainStore: DomainStore;
    uiStore: UIStore;
    viewsRepo: CustomViewsRepository;
    levelsRepo: LevelsRepository;
}

interface State {

}

@observer
class App extends BaseComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {

        };
    }

    render() {
        let { domainStore, uiStore, viewsRepo, levelsRepo } = this.props;

        if (uiStore.screen === 'main-menu') {
            return <MainMenuView domainStore={domainStore} uiStore={uiStore} levelsRepo={levelsRepo} />
        }

        return (<div onMouseDown={() => uiStore.hideContextMenu()}>
            <BoardView 
                boardId={uiStore.activeBoard!} 
                domainStore={domainStore}
                uiStore={uiStore}
                viewsRepo={viewsRepo} />
            <Modal className={modalClasses} overlayClassName={modalOverlayClasses} isOpen={domainStore.isCurrentLevelCompleted()} contentLabel='Level completed'>
                <LevelCompletedView levelName={uiStore.currentLevelDescription ? uiStore.currentLevelDescription.name : '<level name>'} domainStore={domainStore} uiStore={uiStore} levelsRepo={levelsRepo} />
            </Modal>
            <Modal className={modalClasses} overlayClassName={modalOverlayClasses} isOpen={uiStore.levelMenuVisisble} contentLabel='Level pause menu'>
                <LevelMenuView domainStore={domainStore} uiStore={uiStore} />
            </Modal>
        </div>);
    }
}

function stringify(obj: any) {
    return btoa(pako.gzip(JSON.stringify(obj), { level: 9, to: 'string' })) as any as string;
}

function unstringify(compressedString: string) {
    return JSON.parse(pako.inflate(atob(compressedString), { to: 'string' }) as any as string);
}

function getSavedState(): object | null {
    let localStorage = window.localStorage;
    if (localStorage) {
        let lastState = localStorage.getItem(storageKey('state'));
        if (lastState) {
            return unstringify(lastState);
        }
    }
    return null;
}

function main() {
    let root = document.getElementById('react-container'),
        customViewsRepo = new CustomViewsRepository(),
        levelsRepo = new LevelsRepository(),
        domainStore = new DomainStore(),
        uiStore = new UIStore(domainStore);

    customViewsRepo.register('maze', MazeView as CustomObjectReactView);

    for (let level of levels) {
        levelsRepo.register(level);
    }
    
    // TODO: Save/load state
    /*let state = getSavedState();
    if (state) {
        domainStore.loadState(state);
    }*/
    
    (window as any).domainStore = domainStore;
    (window as any).uiStore = uiStore;

    setInterval(() => {
        domainStore.update(Date.now())
    }, 1);

    ReactDOM.render(
        <App domainStore={domainStore} uiStore={uiStore} viewsRepo={customViewsRepo} levelsRepo={levelsRepo} />,
        root
    );
}

main();