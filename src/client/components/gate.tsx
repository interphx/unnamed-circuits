import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Gate } from 'client/domain/gate';
import { Endpoint } from 'client/domain/endpoint';
import { DomainStore } from 'client/domain/domain-store';

export interface GateProps {
    gate: Gate;
    endpoints: Endpoint[];
    isDragged?: boolean;
    domainStore: DomainStore;
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
        let { gate, endpoints, isDragged, domainStore } = this.props,
            x = gate.pos.x,
            y = gate.pos.y,
            width = 96,
            height = 64,
            middleX = 0 + width / 2,
            middleY = 0 + height / 2;

        return (
            <svg className={`gate grabbable ${isDragged ? 'dragged' : ''}`} data-element-type="gate" data-id={gate.id} x={x} y={y} width={width} height={height}>
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