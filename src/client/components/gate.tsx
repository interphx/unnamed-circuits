import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Gate } from 'client/domain/gate';
import { Endpoint } from 'client/domain/endpoint';
import { DomainStore } from 'client/domain/domain-store';
import { Placeable } from 'client/domain/placeable';
import { withPointerEvents, PointersDown } from 'client/components/hoc/with-pointer-events';
import { MoveGateInteraction, BoxPositionChecker } from 'client/view-model/drag/move-gate';
import { DragInteraction } from 'client/view-model/drag/drag-interaction';
import { DragManager } from 'client/view-model/drag-manager';

export interface GateProps {
    gate: Gate;
    isDragged: () => boolean;
    getPlaceable: () => Placeable;
    startDrag: (event: React.MouseEvent<any> | PointerEvent) => void;
    showContextMenu: (event: React.MouseEvent<any> | PointerEvent) => void;
}

export interface GateState {
    
}

@observer
export class GateView extends BaseComponent<GateProps, GateState> {
    constructor(props: GateProps) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        //console.log('Gate rendering', this.props.gate.id);
        
        let { startDrag, showContextMenu, isDragged, gate } = this.props,
            { x, y } = this.props.getPlaceable().pos,
            { name } = this.props.gate,
            width = 96,
            height = 64,
            middleX = 0 + width / 2,
            middleY = 0 + height / 2;
        return (
            <svg 
                onMouseDown={event => 
                    event.button === 0 ? startDrag(event) : showContextMenu(event)
                } 
                onDragStart={event => event.preventDefault()}
                className={`gate grabbable ${isDragged() ? 'gate--dragged' : ''}`} 
                x={x} y={y} width={width} height={height}
            >  
                <g className={`${isDragged() ? 'gate--dragged' : ''}`} >
                    { 
                        !gate.image && isDragged() &&
                        <rect x={3} y={3} width={width} 
                            height={height} 
                            className="gate--shadow" 
                        />  
                    }

                    {
                        gate.image &&
                        <image xlinkHref={gate.image} width={width} height={height} />
                    }

                    {
                        !gate.image &&
                        <rect x={0} y={0} width={width} 
                            height={height} 
                            style={{ fill: 'white', stroke: '#333', strokeWidth: 1 }} 
                        />
                    }
                    <text x={middleX} y={middleY} 
                        className="grabbable noselect"
                        textAnchor="middle" alignmentBaseline="central"
                    >
                        { name }
                    </text>
                </g>
            </svg>
        );
    }
}