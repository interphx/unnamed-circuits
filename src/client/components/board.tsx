import * as React from 'react';
import { observer } from 'mobx-react';
import * as Modal from 'react-modal';

import { BaseComponent } from 'client/base';
import { BoardId } from 'client/domain/board';
import { DomainStore } from 'client/domain/domain-store';
import { Gate, GateTypes, GateType, Custom } from 'client/domain/gate';
import { GateView } from 'client/components/gate';
import { withPointerEvents, PointersDown } from 'client/components/hoc/with-pointer-events';
import { ConnectionView } from 'client/components/connection';
import { UIStore } from 'client/view-model/ui-store';
import { Vec2 } from 'client/util/vec2';
import { assert } from 'client/util/assert';
import { Connection } from 'client/domain/connection';
import { Endpoint } from 'client/domain/endpoint';
import { distanceFromPointToLine } from 'client/util/geometry';
import { EndpointView } from 'client/components/endpoint';
import { GatesMenuView } from 'client/components/gates-menu';
import { LevelCompletedView } from 'client/components/level-completed';
import { CustomViewsRepository } from 'client/custom-views-repository';
import { Placeable } from 'client/domain/placeable';
import { LevelRunningOverlayView } from 'client/components/level-running-overlay';
import { LevelFailedOverlayView } from 'client/components/level-failed-overlay';
import { LevelTipsView } from 'client/components/level-tips';
import { DragManager } from 'client/view-model/drag-manager';
import { MoveGateInteraction } from 'client/view-model/drag/move-gate';
import { MovePin } from 'client/view-model/drag/move-joint';
import { PanInteraction } from 'client/view-model/drag/pan';
import { BoardContextMenu, BoardContextMenuItem } from 'client/view-model/context-menu';
import { BoardContextMenuView } from 'client/components/board-context-menu';
import { computed } from 'mobx';
import { UIArrowView } from 'client/components/ui-arrow';
import { UIArrow } from 'client/view-model/ui-arrow';

enum MouseButton {
    Primary = 0,
    Middle = 1,
    Secondary = 2
}

enum PointerType {
    Mouse = 'mouse',
    Pen = 'pen',
    Touch = 'touch'
}

interface BoardProps {
    boardId: BoardId;
    domainStore: DomainStore;
    uiStore: UIStore;
    viewsRepo: CustomViewsRepository;
}

interface BoardState {

}

function getNewPointIndex(point: Vec2, points: Vec2[]) {
    if (points.length < 2) {
        throw new Error(`Cannot find an index for a new point if the line contains less than 2 points`);
    }
    
    let minDistance = Infinity,
        minIndex = NaN;
    for (let i = 0; i < points.length - 1; ++i) {
        let a = points[i],
            b = points[i + 1],
            distance = distanceFromPointToLine(point.x, point.y, a.x, a.y, b.x, b.y);
        if (distance < minDistance) {
            minDistance = distance;
            minIndex = i;
        }
    }

    return minIndex;
}

@observer
export class BoardView extends BaseComponent<BoardProps, BoardState> {
    container: SVGSVGElement;
    transformContainer: SVGGElement;
    gatesMenu: SVGGElement;
    dragManager: DragManager;

    handleSetTransformContainer(element?: SVGGElement | null) {
        if (element) {
            this.transformContainer = element;
        }
    }

    constructor(props: BoardProps) {
        super(props);
        this.state = {
            isPanning: false,
            zoom: 1
        };

        this.dragManager = new DragManager(props.domainStore, props.uiStore);

        this.clientPointToSVG = this.clientPointToSVG.bind(this);
        this.svgPointToClient = this.svgPointToClient.bind(this);
        this.isDroppedOnMenu = this.isDroppedOnMenu.bind(this);
    }

    componentDidMount() {
        // TODO: Cleanup on unmount
        document.addEventListener('mousemove', event => {
            this.dragManager.update(this.clientCoordinatesToSVG(event.clientX, event.clientY));
        });
        document.addEventListener('mouseup', () => {
            this.dragManager.endAll();
        });
    }

    clientPointToSVG(point: Vec2) {
        let svgPoint = this.container.createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        let svgResult = svgPoint
            .matrixTransform(this.container.getScreenCTM().inverse())
            .matrixTransform(this.transformContainer.getCTM().inverse());
        return Vec2.fromCartesian(svgResult.x, svgResult.y);
    }

    svgPointToClient(point: Vec2) {
        let svgPoint = this.container.createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        let svgResult = svgPoint
            .matrixTransform(this.transformContainer.getCTM())
            .matrixTransform(this.container.getScreenCTM());
            
        return Vec2.fromCartesian(svgResult.x, svgResult.y);
    }

    clientCoordinatesToSVG(x: number, y: number) {
        let svgPoint = this.container.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;
        let svgResult = svgPoint
            .matrixTransform(this.container.getScreenCTM().inverse())
            .matrixTransform(this.transformContainer.getCTM().inverse());
        return Vec2.fromCartesian(svgResult.x, svgResult.y);
    }

    handleMouseWheel(event: React.WheelEvent<any>) {
        if (this.isMenuPoint(event.clientX, event.clientY)) {
            return;
        }

        let delta = -Math.sign(event.deltaY),
            zoomPoint = this.clientCoordinatesToSVG(event.clientX, event.clientY);
        this.props.uiStore.zoomBy(delta * 0.1, zoomPoint.x, zoomPoint.y);
    }

    isMenuPoint(clientX: number, clientY: number): boolean {
        let bbox = this.gatesMenu.getBBox();
        return ( 
            clientX >= bbox.x &&
            clientX < bbox.x + bbox.width &&
            clientY >= bbox.y &&
            clientY < bbox.y + bbox.height
        );
    }

    isDroppedOnMenu(x: number, y: number, width: number, height: number) {
        let menuBBox = this.gatesMenu.getBBox();
        let droppedOnMenu = this.svgPointToClient({x, y}).x + ((width / 2) * this.props.uiStore.zoom) < menuBBox.x + menuBBox.width;
        return droppedOnMenu;
    }

    handleSetContainer(element?: SVGSVGElement | null) {
        if (element) {
            this.container = element;
        }
    }

    handleSetGatesMenu(element?: SVGGElement | null) {
        if (element) {
            this.gatesMenu = element;
        }
    }

    handleStartPan(event: React.MouseEvent<any> | PointerEvent) {
        this.dragManager.startDrag(new PanInteraction(this.clientCoordinatesToSVG(event.clientX, event.clientY)));
    }

    renderGate = (gate: Gate) => {
        //let placeable = this.props.domainStore.placeables.getById(gate.placeableId);
        return (
            <GateView 
                gate={gate}
                getPlaceable={() => this.props.domainStore.placeables.getById(gate.placeableId)}

                key={gate.id} 
                isDragged={() => this.props.uiStore.draggedGate === gate.id}
                startDrag={event => {
                    if (event.button !== MouseButton.Primary) return;
                    event.stopPropagation();

                    this.dragManager.startDrag(new MoveGateInteraction(
                        this.clientCoordinatesToSVG(event.clientX, event.clientY),
                        this.props.domainStore.placeables.getById(gate.placeableId),
                        gate,
                        this.isDroppedOnMenu
                    ));
                }}
                showContextMenu={event => {
                    if (event.button !== MouseButton.Secondary) return;
                    event.stopPropagation();
                    let pos = this.clientCoordinatesToSVG(event.clientX, event.clientY);
                    let actions: BoardContextMenuItem[] = [];
                    if (gate.deletable) {
                        actions.push({
                            caption: 'Delete',
                            onClick: () => { this.props.domainStore.removeGate(gate.id); }
                        });
                    }
                    if (gate instanceof Custom) {
                        actions.push({
                            caption: 'Edit',
                            onClick: () => { this.props.uiStore.setActiveBoard(gate.nestedBoardId); }
                        });
                    }
                    this.props.uiStore.showContextMenu(pos, actions);
                }}
            />
        );
    }

    renderConnection = (connection: Connection) => {
        let {domainStore, uiStore} = this.props;

        /*let input = connection.input ? domainStore.endpoints.getById(connection.input) : undefined,
            output = connection.output ? domainStore.endpoints.getById(connection.output) : undefined,
            gateA = input ? domainStore.gates.getById(input.gateId) : undefined,
            gateB = output ? domainStore.gates.getById(output.gateId) : undefined;*/
        return (
            <ConnectionView 
                key={connection.id} 
                isActive={() => uiStore.activeConnection === connection.id}
                transitionSeconds={domainStore.getTickDurationSeconds() * 0.8}
                getPoints={() => domainStore.getAllConnectionPoints(connection.id)}
                getSignalValue={() => {
                    let input = connection.input ? domainStore.endpoints.getById(connection.input) : undefined,
                        output = connection.output ? domainStore.endpoints.getById(connection.output) : undefined;
                    return (input && input.type === 'output' && input.value) ||
                        (output && output.type === 'output' && output.value) ||
                        0
                }}
                setActive={ () => uiStore.setActiveConnection(connection.id) }
                unsetActive={ () => uiStore.unsetActiveConnection(connection.id) }
                createDragJointCallback={joint => event => {
                    event.stopPropagation();
                    /*this.dragManager.startDrag(new MoveJoint(
                        this.clientCoordinatesToSVG(event.clientX, event.clientY),
                        connection,
                        joint,
                        joint === connection.joints[connection.joints.length - 1]
                    ));*/
                }}
            />
        );
    }

    renderEndpoint = (endpoint: Endpoint) => {
        let { domainStore } = this.props;
        //let pos = this.props.domainStore.getEndpointPositionCenter(endpoint.id);
        return (
            <EndpointView 
                key={endpoint.id}
                endpoint={endpoint}
                getPos={() => this.props.domainStore.getEndpointPositionCenter(endpoint.id)}


                //type={endpoint.type}
                //value={endpoint.value}
                transitionSeconds={domainStore.getTickDurationSeconds() * 0.8}
                //x={pos.x}
                //y={pos.y}
                startDrag={event => {
                    event.stopPropagation();
                    let connection = domainStore.connections.create(
                        domainStore.getWirePath.bind(domainStore), 
                        endpoint.type === 'output' ? endpoint.id : undefined,
                        endpoint.type === 'input' ? endpoint.id : undefined
                    );
                    let startPin = domainStore.getEndpointPositionCenterComputed(endpoint.id);
                    let startPinWithOffset = domainStore.getEndpointPositionWithOffsetComputed(endpoint.id);
                    let draggedEndPin = domainStore.getEndpointPositionWithOffset(endpoint.id);
                    connection.appendComputedPin(startPin, 'straight');
                    connection.appendComputedPin(startPinWithOffset);
                    let endPinId = connection.appendComputedPin(draggedEndPin);
                    this.dragManager.startDrag(new MovePin(
                        Vec2.clone(draggedEndPin),
                        connection,
                        endPinId,
                        true
                    ));
                }}
            />
        );
    }

    getUIArrowPoint(point: UIArrow['startPos'] | UIArrow['endPos']) {
        if (point.type === 'board') {
            return this.svgPointToClient(point.pos);
        } else if (point.type === 'screen') {
            return point.pos;
        } else {
            throw new Error(`Point type unknown: ${point.type}`);
        }
    }

    renderUIArrow(uiArrow: UIArrow) {
        let start = this.getUIArrowPoint(uiArrow.startPos),
            end = this.getUIArrowPoint(uiArrow.endPos);
        return <UIArrowView key={uiArrow.id} screenPosStart={start} screenPosEnd={end} />
    }

    render() {
        // console.log('Board rendering');
        let { boardId, domainStore, uiStore, viewsRepo } = this.props,
            gates = domainStore.gates.getGatesOfBoard(boardId).filter(gate => uiStore.draggedGate !== gate.id),
            draggedGate = uiStore.draggedGate ? domainStore.gates.getById(uiStore.draggedGate) : null,
            connections = domainStore.connections.getAll(),
            endpoints = domainStore.endpoints.getAll().filter(endpoint => endpoint.gateId !== uiStore.draggedGate),
            draggedEndpoints = draggedGate ? domainStore.getEndpointsOfGate(draggedGate.id) : [],
            customObjects = domainStore.customObjects.getAll(),
            uiArrows = uiStore.uiArrows;

        // console.log(`local board id: ${boardId}, actual: ${uiStore.activeBoard}`);

        let customObjectsViews = customObjects.map(obj => {
            let CustomView = viewsRepo.get(obj.type);
            return <CustomView key={obj.id} customObject={obj} placeable={domainStore.placeables.getById(obj.placeableId)} />
        });

        let levelResult = domainStore.getCurrentLevelResult();
        
        return (
            <div className="board">
                <svg 
                    width={'100%'} height={'100%'} 
                    ref={this.handleSetContainer}
                    onWheel={this.handleMouseWheel}
                    onMouseDown={this.handleStartPan}
                    onDragStart={event => event.preventDefault()}
                    style={{ border: '1px solid black' }}
                >
                    <defs>
                        <pattern id="dot" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform={`translate(${uiStore.panX + 8 * uiStore.zoom} ${uiStore.panY + 8 * uiStore.zoom}) scale(${uiStore.zoom})`} >
                            <circle cx={8} cy={8} r={1} fill='#BBE' />
                        </pattern>
                        <marker id="marker-triangle" viewBox="0 0 10 10" refX="1" refY="5"
                            markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" />
                        </marker>
                        <radialGradient id="board-gradient">
                            <stop offset="20%" stop-color="#f7f4ed"/>
                            <stop offset="100%" stop-color="#fcf6bd"/>
                        </radialGradient>
                    </defs>
                    <rect x={0} y={0} width={'100%'} height={'100%'} fill='url(#board-gradient)' />
                    <rect x={0} y={0} width={'100%'} height={'100%'} fill='url(#dot)' />
                    <g 
                        transform={`translate(${uiStore.panX} ${uiStore.panY}) scale(${uiStore.zoom})`} 
                        ref={this.handleSetTransformContainer}
                    >
                        <LevelTipsView 
                            domainStore={domainStore} 
                            uiStore={uiStore} 
                            x={-400} y={20} 
                            width={380} height={200} 
                            lines={
                                (uiStore.currentLevelDescription && uiStore.currentLevelDescription.getCurrentTip) 
                                ? uiStore.currentLevelDescription.getCurrentTip(domainStore, uiStore) 
                                : undefined
                            } 
                        />
                        { gates.map(this.renderGate) }
                        { customObjectsViews }
                        { connections.map(this.renderConnection) }
                        { endpoints.map(this.renderEndpoint) }
                        { uiStore.contextMenu 
                            ? <BoardContextMenuView 
                                x={uiStore.contextMenu.pos.x} 
                                y={uiStore.contextMenu.pos.y}
                                items={uiStore.contextMenu.items} /> 
                            : undefined }
                    </g>
                    <GatesMenuView 
                        setGroupRef={this.handleSetGatesMenu} 
                        gateTypes={domainStore.getAvailableGateTypes()} 
                        levelRunning={domainStore.isCurrentLevelRunning()}
                        createCreateAndStartDragCallback={gateType => event => {
                            event.stopPropagation();
                            let element = event.currentTarget as SVGElement,
                                bbox = element.getBoundingClientRect(),
                                gate = domainStore.createGateOnBoard(gateType, boardId, this.clientCoordinatesToSVG(bbox.left, bbox.top)),
                                placeable = domainStore.placeables.getById(gate.placeableId);
                            this.dragManager.startDrag(new MoveGateInteraction(
                                this.clientCoordinatesToSVG(event.clientX, event.clientY),
                                placeable,
                                gate,
                                this.isDroppedOnMenu
                            ));  
                        }}
                        resetLevel={() => domainStore.resetLevel()}
                        startLevel={() => domainStore.startLevel()}
                        showLevelMenu={() => uiStore.showLevelMenu()}
                    />
                    <LevelRunningOverlayView 
                        domainStore={domainStore} 
                        uiStore={uiStore} 
                        visible={domainStore.isCurrentLevelRunning()}
                    />
                    { domainStore.isCurrentLevelFailed() 
                        ? <LevelFailedOverlayView 
                            domainStore={domainStore} 
                            uiStore={uiStore} 
                            text={(levelResult && levelResult.type === 'fail') ? levelResult.reason : ''} 
                          /> 
                        : undefined 
                    }

                    { uiArrows.map(this.renderUIArrow.bind(this)) }

                    <g transform={`translate(${uiStore.panX} ${uiStore.panY}) scale(${uiStore.zoom})`}>
                        { draggedGate && this.renderGate(draggedGate) } 
                        { draggedGate ? draggedEndpoints.map(this.renderEndpoint) : null }
                    </g>

                </svg>
            </div>
        );
        
    }
}