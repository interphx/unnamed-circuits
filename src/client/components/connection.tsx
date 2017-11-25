import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Connection, ConnectionId } from 'client/domain/connection';
import { Vec2, Vec2Like } from 'client/domain/vec2';
import { Endpoint } from 'client/domain/endpoint';
import { Gate } from 'client/domain/gate';
import { UIStore } from 'client/view-model/ui-store';
import { DomainStore } from 'client/domain/domain-store';

function startDragConnectionPoint() {

}

export interface JointViewProps {
    x: number;
    y: number;
    index: number;
    isActive: boolean;
    startDrag?: (event: React.MouseEvent<any> | PointerEvent) => void;
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
        let { x, y, index, isActive, startDrag } = this.props;
        return <circle className={`connection__drag-point ${ isActive ? 'connection__drag-point--active' : '' }`}
                       onMouseDown={startDrag}
                       r={6}
                       cx={x}
                       cy={y} />
    }
}



export interface ConnectionProps {
    isActive: boolean;
    activeJointIndex?: number;
    points: Vec2Like[];
    joints: Vec2[];
    signalValue: number;
    setActive?: () => void;
    unsetActive?: () => void;
    createDragJointCallback?: (joint: Vec2) => (event: React.MouseEvent<any> | PointerEvent) => void;
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
        let { 
            points, 
            signalValue, 
            joints, 
            isActive, 
            activeJointIndex, 
            setActive, 
            unsetActive, 
            createDragJointCallback
        } = this.props;

        let pathAttr = `M${points.map(point => `${ point.x } ${ point.y }`).join(' ')}`;

        return <g onMouseEnter={setActive}
                  onMouseMove={setActive}
                  onMouseOut={unsetActive} 
                  className={`connection-group ${isActive ? 'connection-group--active' : ''}`}>
            <path key="depth-outline" 
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: 'white', strokeWidth: 8}} d={pathAttr} />
            <path key="path" 
                  className="connection" 
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: signalValue > 0.5 ? 'red' : 'black', strokeWidth: 3}} d={pathAttr} />
            <path key="path-thick" 
                  className="connection__thick"
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: '#000', strokeWidth: 12}} d={pathAttr} />
            {
                joints.map((joint, index) => {
                    return <JointView key={index} index={index} x={joint.x} y={joint.y} 
                                      isActive={isActive && activeJointIndex === index}
                                      startDrag={createDragJointCallback && createDragJointCallback(joint)} />
                })
            }
        </g>;
    }
}