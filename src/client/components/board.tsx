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
import { CustomObject } from 'client/domain/custom-object';
import { LevelRunningOverlayView } from 'client/components/level-running-overlay';
import { LevelFailedOverlayView } from 'client/components/level-failed-overlay';
import { LevelTipsView } from 'client/components/level-tips';

interface EndpointAtPos {
    endpoint: Endpoint;
    pos: Vec2;
}

interface SingleDragInteraction {
    startPos: Vec2;
    offset: Vec2;
}

interface PanDragInteraction extends SingleDragInteraction {
    type: 'pan';
}

interface MoveGateDragInteraction extends SingleDragInteraction {
    type: 'move-gate';
    gate: Gate;
}

interface MoveJointDragInteraction extends SingleDragInteraction {
    type: 'move-joint';
    connection: Connection;
    joint: Vec2;
    isEnd: boolean;
    snapEndpoint?: Endpoint;
}

interface MoveCustomObjectInteraction extends SingleDragInteraction {
    type: 'move-custom-object';
    object: CustomObject;
}

type DragInteraction = PanDragInteraction | MoveGateDragInteraction | MoveJointDragInteraction | MoveCustomObjectInteraction;

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
    isPanning: boolean;
    zoom: number;
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
@withPointerEvents<BoardProps, typeof BoardView>()
export class BoardView extends BaseComponent<BoardProps, BoardState> {
    container: SVGSVGElement;
    transformContainer: SVGGElement;
    gatesMenu: SVGGElement;
    drag?: DragInteraction;

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

    findParentWithType(node?: Node | null, type?: string): Element | null {
        if (!node) return null;
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        let elementType = (node as Element).getAttribute('data-element-type');
        if (!elementType || (type && elementType !== type)) {
            return node.parentNode ? this.findParentWithType(node.parentNode, type) : null;
        }
        return node as Element;
    }

    handlePointerDown(event: PointerEvent, pointersDown: PointersDown) {
        event.preventDefault();

        let { domainStore, uiStore } = this.props;

        let element = this.findParentWithType(event.target as Node)!,
            elementType = element ? element.getAttribute('data-element-type') : '';

        switch (elementType) {
            case 'gate':
                let gateId = element.getAttribute('data-id');
                if (!gateId) { throw new Error('Attempt to drag a gate with falsy id'); }
                let gate = domainStore.getGateById(gateId);
                uiStore.setDraggedGate(gate.id);
                this.drag = {
                    type: 'move-gate',
                    startPos: Vec2.fromPlainObject(gate.pos),
                    offset: Vec2.zero(),
                    gate: gate
                };
                break;
            case 'endpoint':
                let endpointId = element.getAttribute('data-id');
                if (!endpointId) { throw new Error('Attempt to drag an endpoint with falsy id'); }
                let endpoint = domainStore.getEndpointById(endpointId),
                    newConnection = endpoint.type === 'output'
                        ? domainStore.createConnectionFrom(endpoint.id)
                        : domainStore.createConnectionTo(endpoint.id),
                    newJoint = domainStore.getEndpointPositionForConnection(endpoint.id);

                newConnection.joints.push(newJoint);

                this.drag = {
                    type: 'move-joint',
                    startPos: Vec2.fromPlainObject(domainStore.getEndpointPositionForConnection(endpoint.id)),
                    offset: Vec2.zero(),
                    connection: newConnection,
                    joint: newJoint,
                    isEnd: true
                };
                break;
            case 'joint':
                let jointIndex = element.getAttribute('data-index'),
                    jointConnectionId = element.getAttribute('data-connection-id');
                if (!jointIndex) { throw new Error('Attempt to drag a joint with falsy index'); }
                if (!jointConnectionId) { throw new Error('Attempt to drag a joint with connection with falsy id'); }
                let jointConnection = domainStore.getConnectionById(jointConnectionId),
                    joint = jointConnection.joints[parseInt(jointIndex)];
                this.drag = {
                    type: 'move-joint',
                    startPos: Vec2.fromPlainObject(joint),
                    offset: Vec2.zero(),
                    connection: jointConnection,
                    joint: joint,
                    isEnd: joint === jointConnection.joints[jointConnection.joints.length - 1]
                };
                break;
            case 'connection':
                let connectionId = element.getAttribute('data-id');
                if (!connectionId) { throw new Error('Attempt to drag a join of conneciton with falsy id'); }
                let connection = domainStore.getConnectionById(connectionId);
                let pos = this.clientCoordinatesToSVG(event.clientX, event.clientY);
                let index = getNewPointIndex(pos, domainStore.getAllConnectionPoints(connection.id));
                let newIntermediateJoint = Vec2.fromPlainObject(pos);
                connection.joints.splice(index, 0, newIntermediateJoint);
                this.drag = {
                    type: 'move-joint',
                    startPos: Vec2.fromPlainObject(newIntermediateJoint),
                    offset: Vec2.zero(),
                    connection: connection,
                    joint: newIntermediateJoint,
                    isEnd: false
                };
                break;
            case 'menu-gate-button':
                let gateType = element.getAttribute('data-gate-type') as GateType | null;
                if (!gateType) { throw new Error('Attempt to create a gate with falsy type'); }
                if (GateTypes.indexOf(gateType) < 0) { throw new Error(`Unknown gate type: ${gateType}`); }
                let gateButtonBB = element.getBoundingClientRect();
                let newGate = domainStore.createGateForBoard(gateType, this.props.boardId, this.clientCoordinatesToSVG(gateButtonBB.left, gateButtonBB.top));
                uiStore.setDraggedGate(newGate.id);
                this.drag = {
                    type: 'move-gate',
                    startPos: Vec2.fromPlainObject(newGate.pos),
                    offset: Vec2.zero(),
                    gate: newGate
                };
                break;
            case 'custom-object':
                let customObjectId = element.getAttribute('data-id');
                if (!customObjectId) { throw new Error('Attempt to drag a custom object with falsy id'); }
                let customObject = domainStore.getCustomObjectById(customObjectId);
                this.drag = {
                    type: 'move-custom-object',
                    startPos: Vec2.fromPlainObject(customObject.pos),
                    offset: Vec2.zero(),
                    object: customObject
                };
                break;
            default:
                this.drag = {
                    type: 'pan',
                    startPos: Vec2.fromCartesian(uiStore.panX, uiStore.panY),
                    offset: Vec2.zero()
                };
                this.setState({ isPanning: true });
                break;
        }
    }

    zoomBy(zoom: number, toPointX: number = 0, toPointY: number = 0) {
        let { uiStore } = this.props;

        let oldZoom = this.state.zoom,
            newZoom = Math.min(3, Math.max(0.2, this.state.zoom + zoom)),
            delta = newZoom - oldZoom;
        this.setState({
            zoom: newZoom
        });
        uiStore.panX = uiStore.panX - delta * toPointX,
        uiStore.panY = uiStore.panY - delta * toPointY
    }

    handleMouseWheel(event: React.WheelEvent<any>) {
        if (this.isMenuPoint(event.clientX, event.clientY)) {
            return;
        }

        let delta = -Math.sign(event.deltaY),
            zoomPoint = this.clientCoordinatesToSVG(event.clientX, event.clientY);
        this.zoomBy(delta * 0.1, zoomPoint.x, zoomPoint.y);
    }

    
    handlePointerDrag(event: PointerEvent, pointersDown: PointersDown) {
        if (!this.drag) return;

        let pointA = this.clientPointToSVG({ x: event.clientX, y: event.clientY });
        let pointB = this.clientPointToSVG({ x: pointersDown.get(event.pointerId)!.x, y: pointersDown.get(event.pointerId)!.y });
        let svgDelta = pointA.subVec2(pointB);

        this.drag.offset.addVec2(svgDelta);

        let drag = this.drag,
            { startPos, offset } = drag,
            { domainStore, uiStore } = this.props;

        switch (drag.type) {
            case 'pan':
                uiStore.panX = startPos.x + offset.x * this.state.zoom;
                uiStore.panY = startPos.y + offset.y * this.state.zoom;
                break;
            case 'move-gate':
                if (!domainStore.gateExists(drag.gate.id)) { this.drag = undefined; return; }

                drag.gate.pos.x = startPos.x + offset.x;
                drag.gate.pos.y = startPos.y + offset.y;
                if (event.ctrlKey) {
                    drag.gate.pos.snapTo(16);
                }
                break;
            case 'move-custom-object':
                if (!domainStore.customObjectExists(drag.object.id)) { this.drag = undefined; return; }

                drag.object.pos.x = startPos.x + offset.x;
                drag.object.pos.y = startPos.y + offset.y;
                if (event.ctrlKey) {
                    drag.object.pos.snapTo(16);
                }
                break;
            case 'move-joint':
                if (!domainStore.connectionExists(drag.connection.id)) { this.drag = undefined; uiStore.unsetActiveConnection(drag.connection.id); return; }

                let candidatePoint = drag.startPos.clone().addVec2(drag.offset);

                uiStore.setActiveConnection(drag.connection.id);
                uiStore.setActiveJoint(drag.connection.joints.indexOf(drag.joint));
                
                if (drag.isEnd) {
                    // Extremely unoptimized, please replace
                    let invalidEndpoints = [drag.connection.endpointA, drag.connection.endpointB]
                        .filter(endpointId => Boolean(endpointId))
                        .map(endpointId => domainStore.getEndpointById(endpointId!))
                        .reduce((invalidEndpoints, endpoint) => invalidEndpoints.concat(domainStore.getEndpointsOfGate(endpoint.gateId)), [] as Endpoint[])
                        .map(endpoint => endpoint.id);

                    let missingEndpointType = domainStore.getMissingEndpointType(drag.connection.id);

                    let endpointsAtPositions = domainStore
                        .getAllEndpoints()
                        .filter(endpoint => 
                            invalidEndpoints.indexOf(endpoint.id) < 0 && 
                            endpoint.type === missingEndpointType &&
                            (endpoint.type === 'output' || !domainStore.isEndpointOccupied(endpoint.id))
                        )
                        .map(endpoint => ({ endpoint: endpoint, pos: domainStore.getEndpointPositionForConnection(endpoint.id) }));
                    let nearestPoint = endpointsAtPositions.reduce((nearest, curr) => {
                        let currDist = curr ? curr.pos.distanceTo(candidatePoint) : Infinity,
                            nearestDist = nearest ? nearest.pos.distanceTo(candidatePoint): Infinity;
                        if (currDist <= 12 && currDist < nearestDist) return curr;
                        return nearest;
                    }, null as EndpointAtPos | null);

                    if (nearestPoint) {
                        drag.joint.setFrom(nearestPoint.pos);
                        drag.snapEndpoint = nearestPoint.endpoint;
                    } else {
                        drag.joint.setFrom(candidatePoint);
                        if (event.ctrlKey) drag.joint.snapTo(16);
                        drag.snapEndpoint = undefined;
                    }
                } else {
                    drag.joint.setFrom(candidatePoint);
                    if (event.ctrlKey) drag.joint.snapTo(16);
                    drag.snapEndpoint = undefined;
                }
                break;
            default:
                break;
        }
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

    handlePointerUp(event: PointerEvent, pointersDown: PointersDown) {
        if (!this.drag) return;

        let { domainStore, uiStore } = this.props;

        switch(this.drag.type) {
            case 'pan':
                this.setState({ isPanning: false });
                break;
            case 'move-gate':
                uiStore.unsetDraggedGate();
                let menuBBox = this.gatesMenu.getBBox();
                let droppedOnMenu = this.svgPointToClient(this.drag.gate.pos).x + (48 * this.state.zoom) < menuBBox.x + menuBBox.width;
                if (droppedOnMenu) {
                    if (this.drag.gate.deletable) {
                        domainStore.removeGate(this.drag.gate.id);
                    } else {
                        this.drag.gate.pos.setFrom(this.drag.startPos);
                    }
                }
                break;
            case 'move-custom-object':
                break;
            case 'move-joint':
                if (this.drag.isEnd && this.drag.snapEndpoint) {
                    this.drag.connection.joints.splice(this.drag.connection.joints.indexOf(this.drag.joint), 1);
                    if (!this.drag.connection.endpointA) {
                        this.drag.connection.endpointA = this.drag.snapEndpoint.id;
                    } else {
                        this.drag.connection.endpointB = this.drag.snapEndpoint.id;
                    }
                }
                if (!domainStore.isValidConnection(this.drag.connection.id)) {
                    domainStore.removeConnection(this.drag.connection.id);
                }
                uiStore.unsetActiveConnection();
                break;
            default:
                break;
        }

        this.drag = undefined;
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
            draggedEndpoints = draggedGate ? domainStore.getEndpointsOfGate(draggedGate.id) : [],
            customObjects = domainStore.getAllCustomObjects();

        let customObjectsViews = customObjects.map(obj => {
            let CustomView = viewsRepo.get(obj.type);
            return <CustomView key={obj.id} id={obj.id} pos={obj.pos} model={obj.model} />
        });

        let levelResult = domainStore.getCurrentLevelResult();
        
        return (
            <div className="board">
                <svg width={'100%'} height={'100%'} 
                     ref={this.handleSetContainer}
                     onWheel={this.handleMouseWheel}
                     style={{ border: '1px solid black' }}
                >
                    <g transform={`translate(${uiStore.panX} ${uiStore.panY}) scale(${this.state.zoom})`} ref={this.handleSetTransformContainer}>
<LevelTipsView domainStore={domainStore} uiStore={uiStore} x={-400} y={20} width={380} height={200} lines={(uiStore.currentLevelDescription && uiStore.currentLevelDescription.getCurrentTip) ? uiStore.currentLevelDescription.getCurrentTip(domainStore, uiStore) : undefined} />
                    { 
                        gates.map(gate =>
                            <GateView key={gate.id} 
                                      gate={gate}
                                      endpoints={domainStore.getEndpointsOfGate(gate.id)}
                                      domainStore={domainStore} />
                        ) 
                    }
                    { customObjectsViews }
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
                    <g transform={`translate(${uiStore.panX} ${uiStore.panY}) scale(${this.state.zoom})`}>
                        { draggedGate ? <GateView gate={draggedGate} 
                                                  domainStore={domainStore} 
                                                  endpoints={domainStore.getEndpointsOfGate(draggedGate.id)}
                                                  isDragged={true} /> 
                                    : null 
                        } 
                        { draggedGate ? draggedEndpoints.map(endpoint => <EndpointView domainStore={domainStore} key={endpoint.id} endpoint={endpoint} />) : null }
                    </g>

                </svg>
            </div>
        );
        
    }
}