import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Gate } from 'client/domain/gate';
import { Endpoint } from 'client/domain/endpoint';
import { DomainStore } from 'client/domain/domain-store';
import { Placeable } from 'client/domain/placeable';
import { withPointerEvents, PointersDown } from 'client/components/hoc/with-pointer-events';
import { MoveGateInteraction, BoxPositionChecker } from 'client/view-model/drag/move-gate';
import { Vec2Like, Vec2 } from 'client/domain/vec2';
import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { DragManager } from 'client/view-model/drag-manager';

export interface GateProps {
    gate: Gate;
    placeable: Placeable;
    endpoints: Endpoint[];
    isDragged?: boolean;
    domainStore: DomainStore;
    isDroppedOnMenu: BoxPositionChecker;
    clientPointToSVG: (point: Vec2Like) => Vec2;
    dragManager: DragManager;
}

export interface GateState {
    
}

@observer
@withPointerEvents<GateProps, typeof GateView>()
export class GateView extends BaseComponent<GateProps, GateState> {
    container: SVGElement;

    constructor(props: GateProps) {
        super(props);
        this.state = {
            
        }
    }

    interaction?: DragInteraction;
    handlePointerDown(event: PointerEvent, pointersDown: PointersDown) {
        this.interaction = new MoveGateInteraction(
            this.props.clientPointToSVG({x: event.clientX, y: event.clientY}),
            this.props.placeable,
            this.props.gate,
            this.props.isDroppedOnMenu
        );
        this.props.dragManager.startDrag(this.interaction);
        console.log('start');
    }
    handlePointerDrag(event: PointerEvent, pointersDown: PointersDown) {
        if (this.interaction && !this.interaction.isValid) {
            this.interaction = undefined;
        }
        if (!this.interaction) return;
        this.props.dragManager.update(this.props.clientPointToSVG({x: event.clientX, y: event.clientY}));
        console.log('drag');
    }
    handlePointerUp(event: PointerEvent, pointersDown: PointersDown) {
        if (this.interaction && !this.interaction.isValid) {
            this.interaction = undefined;
        }
        if (!this.interaction) return;
        this.props.dragManager.endDrag(this.interaction);
        console.log('up');
    }

    handleSetContainer(element?: SVGElement | null) {
        if (element) {
            this.container = element;
        }
    }

    render() {
        let { gate, placeable, endpoints, isDragged, domainStore } = this.props,
            x = placeable.pos.x,
            y = placeable.pos.y,
            width = 96,
            height = 64,
            middleX = 0 + width / 2,
            middleY = 0 + height / 2;

        return (
            <svg ref={this.handleSetContainer} className={`gate grabbable ${isDragged ? 'dragged' : ''}`} data-element-type="gate" data-id={gate.id} x={x} y={y} width={width} height={height}>
                <rect x={0} y={0} width={width} 
                    height={height} 
                    style={{ fill: 'white', stroke: '#333', strokeWidth: 1 }} 
                />
                <text x={middleX} y={middleY} 
                    className="grabbable noselect"
                    textAnchor="middle" alignmentBaseline="central"
                >
                    { gate.name }
                </text>
            </svg>
        );
    }
}