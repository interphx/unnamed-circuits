import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Connection, ConnectionId } from 'client/domain/connection';
import { Vec2 } from 'client/domain/vec2';
import { Endpoint } from 'client/domain/endpoint';
import { Gate } from 'client/domain/gate';
import { UIStore } from 'client/view-model/ui-store';
import { DomainStore } from 'client/domain/domain-store';

function startDragConnectionPoint() {

}

export interface JointViewProps {
    point: Vec2;
    isEnd?: boolean;
    index: number;
    connectionId: ConnectionId;
    isActive: boolean;
}

export interface JointViewState {
    
}

@observer
export class JointView extends BaseComponent<JointViewProps, JointViewState> {
    constructor(props: JointViewProps) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        let { point, index, connectionId, isActive } = this.props;
        return <circle className={`connection__drag-point ${ isActive ? 'connection__drag-point--active' : '' }`}
                       r={6}
                       cx={point.x}
                       cy={point.y}
                       data-element-type="joint"
                       data-index={index}
                       data-connection-id={connectionId}></circle>
    }
}



export interface ConnectionProps {
    connection: Connection;
    //gateA?: Gate;
    endpointA?: Endpoint;
    //gateB?: Gate;
    endpointB?: Endpoint;

    domainStore: DomainStore;
    uiStore: UIStore;
}

export interface ConnectionState {
    
}

@observer
export class ConnectionView extends BaseComponent<ConnectionProps, ConnectionState> {

    constructor(props: ConnectionProps) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        let { connection, endpointA, endpointB, domainStore, uiStore } = this.props;

        let points: Vec2[] = [];
        if (endpointA) {
            let endpointAPos = domainStore.getEndpointPositionForConnection(endpointA.id);
            points.push(endpointAPos);
        }
        for (let point of connection.joints) {
            points.push(point);
        }
        if (endpointB) {
            let endpointBPos = domainStore.getEndpointPositionForConnection(endpointB.id);
            points.push(endpointBPos);
        }

        let output = (endpointA && endpointA.type === 'output') 
            ? endpointA
            : (endpointB && endpointB.type === 'output')
                ? endpointB
                : null;

        let pathAttr = `M${points.map(point => `${ point.x } ${ point.y }`).join(' ')}`;

        return <g onMouseEnter={() => uiStore.setActiveConnection(connection.id)}
                  onMouseMove={() => uiStore.setActiveConnection(connection.id)}
                  onMouseOut={() => uiStore.unsetActiveConnection(connection.id)} 
                  className={`connection-group ${uiStore.activeConnection === connection.id ? 'connection-group--active' : ''}`}
                  data-element-type="connection"
                  data-id={connection.id}>
            <path key="path" 
                  className="connection" 
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: output && output.value > 0.5 ? 'red' : 'black', strokeWidth: 3}} d={pathAttr} />
            <path key="path-thick" 
                  className="connection__thick"
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: '#000', strokeWidth: 12}} d={pathAttr} />
            {
                connection.joints.map((point, index) => {
                    return <JointView key={index} point={point} index={index} connectionId={connection.id} 
                                      isActive={uiStore.activeConnection === connection.id && uiStore.activeJointIndex === index} />
                })
            }
        </g>;
    }
}