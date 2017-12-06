import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Endpoint, EndpointType } from 'client/domain/endpoint';
import { DomainStore } from 'client/domain/domain-store';
import { Connection } from 'client/domain/connection';
import { Vec2 } from 'client/util/vec2';


export interface EndpointProps {
    endpoint: Endpoint;
    getPos: () => Vec2;
    //type: EndpointType;
    //value: number;
    transitionSeconds: number;
    //x: number;
    //y: number;
    startDrag?: (event: React.MouseEvent<any> | PointerEvent) => void;
}

export interface EndpointState {
    
}

@observer
export class EndpointView extends BaseComponent<EndpointProps, EndpointState> {

    constructor(props: EndpointProps) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        console.log('Endpoint rendering');
        
        let { endpoint, startDrag, transitionSeconds } = this.props,
            { type, value } = endpoint,
            { x, y } = this.props.getPos();

        let ax = x - 6, ay = y + 6,
            bx = x + 6, by = y + 6,
            cx = x, cy = y - 6;

        let bezierAX = ax + 6,
            bezierAY = ay - 12,
            bezierBX = bx - 6,
            bezierBY = by - 12;

        return <path 
                className="endpoint"
                onMouseDown={startDrag}
                d={`M ${ax},${ay} C ${bezierAX},${bezierAY} ${bezierBX},${bezierBY} ${bx},${by}`}
                style={{ fill: value > 0.5 ? 'red' : 'black', transition: `fill ${transitionSeconds}s ease-in` }} />
    }
}