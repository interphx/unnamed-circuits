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
    lastValue: number = 0;

    constructor(props: EndpointProps) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        //console.log('Endpoint rendering');
        
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

        var transitionDelay = 0;
        
        if (endpoint.type === 'input') {
            transitionDelay = transitionSeconds;
            /*if (value > this.lastValue) {
                transitionDelay = transitionSeconds;
                transitionSeconds = 0;
            } else {
                transitionDelay = 0;
                transitionSeconds = transitionSeconds;
            }*/
        } else if (endpoint.type === 'output') {
            transitionDelay = 0;
            /*if (value > this.lastValue) {
                transitionDelay = 0;
                transitionSeconds = 0;
            } else {
                transitionDelay = 0;
                transitionSeconds = 0;
            }*/
        }
        this.lastValue = value;

        return <path 
                className="endpoint"
                onMouseDown={startDrag}
                d={`M ${ax},${ay} C ${bezierAX},${bezierAY} ${bezierBX},${bezierBY} ${bx},${by}`}
                style={{ 
                    fill: value > 0.5 ? 'red' : 'black', 
                    transition: 'fill 0s ease-in',
                    //transition: `fill ${transitionSeconds}s ease-in`,
                    transitionDelay: `${transitionDelay}s`
                }} />
    }
}