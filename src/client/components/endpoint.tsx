import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Endpoint } from 'client/domain/endpoint';
import { DomainStore } from 'client/domain/domain-store';
import { Connection } from 'client/domain/connection';
import { Vec2 } from 'client/domain/vec2';


export interface EndpointProps {
    endpoint: Endpoint;
    domainStore: DomainStore;
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
        let { endpoint, domainStore } = this.props;
        let { x, y } = domainStore.getEndpointPositionCenter(endpoint.id);

        let ax = x - 6, ay = y + 6,
            bx = x + 6, by = y + 6,
            cx = x, cy = y - 6;

        let bezierAX = ax + 6,
            bezierAY = ay - 12,
            bezierBX = bx - 6,
            bezierBY = by - 12;

        return <path className="endpoint"
                        data-element-type="endpoint"
                        data-id={endpoint.id}
                        d={`M ${ax},${ay} C ${bezierAX},${bezierAY} ${bezierBX},${bezierBY} ${bx},${by}`}
                        style={{ fill: endpoint.value > 0.5 ? 'red' : 'black' }} />

        /*return <polygon className="endpoint"
                        data-element-type="endpoint"
                        data-id={endpoint.id}
                        points={[ax, ay, bx, by, cx, cy].join(' ')}
                        style={{ fill: endpoint.value > 0.5 ? 'red' : 'black' }} />*/

        /*return <rect className="endpoint"
                     x={`${x}`} y={`${y}`} 
                     width={12} height={12} 
                     style={{ fill: endpoint.value > 0.5 ? 'red' : 'black' }}
                     data-element-type="endpoint"
                     data-id={endpoint.id} />*/
    }
}