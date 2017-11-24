import * as React from 'react';
import { observer } from 'mobx-react';
import * as Modal from 'react-modal';

import { BaseComponent } from 'client/base';
import { BoardId } from 'client/domain/board';
import { DomainStore } from 'client/domain/domain-store';
import { Gate, GateTypes, GateType } from 'client/domain/gate';
import { GateView } from 'client/components/gate';
import { withPointerEvents, PointersDown } from 'client/components/hoc/with-pointer-events';
import { ConnectionView } from 'client/components/connection';
import { UIStore } from 'client/view-model/ui-store';
import { Vec2, Vec2Like } from 'client/domain/vec2';
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

function getNewPointIndex(point: Vec2Like, points: Vec2Like[]) {
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

    clientPointToSVG(point: Vec2Like) {
        let svgPoint = this.container.createSVGPoint();
        svgPoint.x = point.x;
        svgPoint.y = point.y;
        let svgResult = svgPoint
            .matrixTransform(this.container.getScreenCTM().inverse())
            .matrixTransform(this.transformContainer.getCTM().inverse());
        return Vec2.fromCartesian(svgResult.x, svgResult.y);
    }

    svgPointToClient(point: Vec2Like) {
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

    render() {
        let { boardId, domainStore, uiStore, viewsRepo } = this.props,
            gates = domainStore.getGatesOfBoard(boardId).filter(gate => uiStore.draggedGate !== gate.id),
            draggedGate = uiStore.draggedGate ? domainStore.getGateById(uiStore.draggedGate) : null,
            connections = domainStore.getAllConnections(),
            endpoints = domainStore.getAllEndpoints().filter(endpoint => endpoint.gateId !== uiStore.draggedGate),
            draggedEndpoints = draggedGate ? domainStore.getEndpointsOfGate(draggedGate.id) : [];
            /*customObjects = domainStore.getAllPlaceables()*/

        /*let customObjectsViews = customObjects.map(obj => {
            let CustomView = viewsRepo.get(obj.type);
            return <CustomView key={obj.id} id={obj.id} pos={obj.pos} model={obj.model} />
        });*/

        let levelResult = domainStore.getCurrentLevelResult();
        
        return (
            <div className="board">
                <svg width={'100%'} height={'100%'} 
                     ref={this.handleSetContainer}
                     onWheel={this.handleMouseWheel}
                     style={{ border: '1px solid black' }}
                >
                    <g transform={`translate(${uiStore.panX} ${uiStore.panY}) scale(${uiStore.zoom})`} ref={this.handleSetTransformContainer}>
<LevelTipsView domainStore={domainStore} uiStore={uiStore} x={-400} y={20} width={380} height={200} lines={(uiStore.currentLevelDescription && uiStore.currentLevelDescription.getCurrentTip) ? uiStore.currentLevelDescription.getCurrentTip(domainStore, uiStore) : undefined} />
                    { 
                        gates.map(gate =>
                            <GateView key={gate.id} 
                                      gate={gate}
                                      placeable={domainStore.getPlaceableById(gate.placeableId)}
                                      endpoints={domainStore.getEndpointsOfGate(gate.id)}
                                      domainStore={domainStore}
                                      isDroppedOnMenu={this.isDroppedOnMenu}
                                      clientPointToSVG={this.clientPointToSVG}
                                      dragManager={this.dragManager} />
                        ) 
                    }
                    { /*customObjectsViews*/ }
                    { 
                        connections.map(connection => {
                            
                            let endpointA = connection.endpointA ? domainStore.getEndpointById(connection.endpointA) : undefined,
                                endpointB = connection.endpointB ? domainStore.getEndpointById(connection.endpointB) : undefined,
                                gateA = endpointA ? domainStore.getGateById(endpointA.gateId) : undefined,
                                gateB = endpointB ? domainStore.getGateById(endpointB.gateId) : undefined;
                            return <ConnectionView key={connection.id} 
                                            connection={connection}
                                            endpointA={endpointA}
                                            endpointB={endpointB}
                                            uiStore={uiStore}
                                            domainStore={domainStore} />
                        }) 
                    }
                    {
                        endpoints.map(endpoint =>
                            <EndpointView domainStore={domainStore} key={endpoint.id} endpoint={endpoint} />
                        )
                    }
                    </g>
                    <GatesMenuView setGroupRef={this.handleSetGatesMenu} gateClasses={domainStore.getAvailableGateTypes()} domainStore={domainStore} uiStore={uiStore} />
                    <LevelRunningOverlayView domainStore={domainStore} uiStore={uiStore} visible={domainStore.isCurrentLevelRunning()} />
                    { domainStore.isCurrentLevelFailed() ? <LevelFailedOverlayView domainStore={domainStore} uiStore={uiStore} text={(levelResult && levelResult.type === 'fail') ? levelResult.reason : ''} /> : null }
                    <g transform={`translate(${uiStore.panX} ${uiStore.panY}) scale(${uiStore.zoom})`}>
                        { draggedGate ? <GateView gate={draggedGate} 
                                                  placeable={domainStore.getPlaceableById(draggedGate.placeableId)}
                                                  domainStore={domainStore} 
                                                  endpoints={domainStore.getEndpointsOfGate(draggedGate.id)}
                                                  isDragged={true}
                                                  isDroppedOnMenu={this.isDroppedOnMenu}
                                                  clientPointToSVG={this.clientPointToSVG}
                                                  dragManager={this.dragManager} /> 
                                    : null 
                        } 
                        { draggedGate ? draggedEndpoints.map(endpoint => <EndpointView domainStore={domainStore} key={endpoint.id} endpoint={endpoint} />) : null }
                    </g>

                </svg>
            </div>
        );
        
    }
}