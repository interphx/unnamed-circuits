import { observable, action } from 'mobx';

import { DomainStore } from 'client/domain/domain-store';
import { ConnectionId } from 'client/domain/connection';
import { GateId } from 'client/domain/gate';
import { LevelDescription } from 'client/levels';
import { BoardId } from 'client/domain/board';
import { BoardContextMenu, BoardContextMenuItem } from 'client/view-model/context-menu';
import { Vec2 } from 'client/util/vec2';
import { UIArrow } from 'client/view-model/ui-arrow';
import { UIPos } from 'client/view-model/ui-pos';
import { getRandomId } from 'shared/utils';

const KEY_DELETE = 46;
const KEY_ESCAPE = 27;

type GameScreen = 'main-menu' | 'board';

interface PieceOutput {
    pieceId: string;
    outputId: string;
}

interface PieceInput {
    pieceId: string;
    inputId: string;
}

export class UIStore {
    @observable activeBoard?: BoardId;
    @observable activeConnection?: ConnectionId;
    @observable activePinId?: string;
    @observable draggedGate?: GateId;
    @observable levelMenuVisisble: boolean = false;
    @observable screen: GameScreen = 'main-menu';
    @observable panX: number = 100;
    @observable panY: number = 0;
    @observable zoom: number = 1;
    @observable currentLevelDescription?: LevelDescription;
    @observable contextMenu?: BoardContextMenu;
    @observable uiArrows = observable.array<UIArrow>([]);

    constructor(protected domainStore: DomainStore) {
        document.addEventListener('keydown', event => {
            if (this.activeConnection && event.keyCode === KEY_DELETE) {
                if (this.activePinId !== undefined) {
                    let connection = this.domainStore.connections.getById(this.activeConnection);
                    // TODO: Delete pin
                    //connection.pins.delete(this.activePinId);
                    this.unsetActiveJoint();
                } else {
                    this.domainStore.connections.remove(this.activeConnection);
                    this.unsetActiveConnection();
                }
            } else if (event.keyCode === KEY_ESCAPE) {
                if (this.levelMenuVisisble) {
                    this.hideLevelMenu();
                } else {
                    this.showLevelMenu();
                }
            }
        });

        document.addEventListener('contextmenu', event => event.preventDefault());
    }

    @action
    showContextMenu(pos: Vec2, items: BoardContextMenuItem[]) {
        this.contextMenu = new BoardContextMenu(pos, items);
    }

    @action
    hideContextMenu() {
        this.contextMenu = undefined;
    }

    @action
    zoomBy(zoom: number, toPointX: number = 0, toPointY: number = 0) {
        let oldZoom = this.zoom,
            newZoom = Math.min(3, Math.max(0.2, this.zoom + zoom)),
            delta = newZoom - oldZoom;
        this.zoom = newZoom;
        this.panX = this.panX - delta * toPointX,
        this.panY = this.panY - delta * toPointY
    }

    @action
    goToScreen(screen: GameScreen) {
        if (screen === this.screen) {
            return;
        }

        if (this.screen === 'board') {
            this.unsetActiveBoard();
            this.domainStore.clear();
            this.hideLevelMenu();
        }

        if (screen === 'board' && this.screen !== 'board') {
            this.setActiveBoard(this.domainStore.getMainBoard()!.id);
            let aabb = this.domainStore.getBoardBoundingBox(this.activeBoard!);
            this.panX = aabb.x + window.innerWidth / 2 - aabb.width / 2 - 48;
            this.panY = aabb.y - 32;
        }

        if (screen !== 'board') {
            this.unsetCurrentLevel();
        }

        this.screen = screen;
    }

    @action setCurrentLevel(description: LevelDescription) {
        this.currentLevelDescription = description;
    }

    @action unsetCurrentLevel() {
        this.currentLevelDescription = undefined;
    }

    @action
    showLevelMenu() {
        this.domainStore.pause();
        this.levelMenuVisisble = true;
    }

    @action
    hideLevelMenu() {
        this.domainStore.resume();
        this.levelMenuVisisble = false;
    }

    @action
    setDraggedGate(gateId: GateId) {
        this.draggedGate = gateId;
    }

    @action
    unsetDraggedGate(gateId?: GateId) {
        if (!gateId || gateId === this.draggedGate) {
            this.draggedGate = undefined;
        }
    }

    @action
    setActiveConnection(connectionId: ConnectionId) {
        this.activeConnection = connectionId;
    }

    @action
    setActivePin(pinId: string) {
        this.activePinId = pinId;
    }

    @action
    unsetActiveJoint(pinId?: string) {
        if (pinId !== undefined) {
            if (this.activePinId === pinId) {
                this.activePinId = undefined;
            }
        } else {
            this.activePinId = undefined;
        }
    }

    @action unsetActiveConnection(connectionId?: ConnectionId) {
        if (connectionId) {
            if (this.activeConnection === connectionId) {
                this.activeConnection = undefined;
            }
        } else {
            this.activeConnection = undefined;
        }
        this.activePinId = undefined;
    }

    @action setActiveBoard(boardId: BoardId) {
        this.activeBoard = boardId;
    }

    @action unsetActiveBoard() {
        this.activeBoard = undefined;
    }

    @action createUIArrow(from: UIPos, to: UIPos) {
        let arrow = new UIArrow(getRandomId(10), from, to);
        this.uiArrows.push(arrow);
        return arrow;
    }

    @action removeUIArrow(id: string) {
        let index = this.uiArrows.findIndex(arrow => arrow.id === id);
        this.uiArrows.splice(index, 1);
    }
}