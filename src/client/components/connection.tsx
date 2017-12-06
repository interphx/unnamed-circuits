import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Connection, ConnectionId } from 'client/domain/connection';
import { Vec2 } from 'client/util/vec2';
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
    isActive: () => boolean;
    transitionSeconds: number;
    activeJointIndex?: number;
    getPoints: () => ReadonlyArray<Vec2>;
    //joints: Vec2[];
    getSignalValue: () => number;
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
        console.log('Connection rendering');

        let { 
            getPoints, 
            getSignalValue, 
            //joints, 
            isActive, 
            transitionSeconds,
            activeJointIndex, 
            setActive, 
            unsetActive, 
            createDragJointCallback
        } = this.props;

        let points = getPoints(),
            signalValue = getSignalValue();

        let isOn = signalValue >= 0.5;

        let originalPoints = points;

        if (!isOn) {
            points = points.slice(0).reverse();
        }

        let pathAttr = `M${points.map(point => `${ point.x } ${ point.y }`).join(' ')}`;
        let originalPathAttr = `M${originalPoints.map(point => `${ point.x } ${ point.y }`).join(' ')}`;
        let totalLength = 0;
        for (let i = 0; i < points.length - 1; ++i) {
            let a = points[i],
                b = points[i + 1];
            let distance = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
            totalLength += distance;
        }

        return <g onMouseEnter={setActive}
                  onMouseMove={setActive}
                  onMouseOut={unsetActive} 
                  className={`connection-group ${isActive ? 'connection-group--active' : ''}`}>
            <path 
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: '#EEE', strokeWidth: 8}} d={pathAttr} />
            <path 
                  className="connection" 
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: '#444', strokeWidth: 3}} d={pathAttr} />
            <path  
                  className="connection__signal-flow" 
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: 'red', strokeWidth: 3.6, transition: `stroke-dashoffset ${transitionSeconds}s ease-in`}} 
                  d={pathAttr}
                  strokeDasharray={`${totalLength} ${totalLength}`}
                  strokeDashoffset={isOn ? 0 : totalLength} />
            <path  
                  className="connection__signal-dots"
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: 'white', strokeWidth: 3.6, opacity: isOn ? 0.5 : 0.3}} 
                  d={originalPathAttr}
                  strokeDasharray={`2 30`} />
            <path 
                  className="connection__thick"
                  strokeLinecap='round'
                  style={{fill: 'none', stroke: '#000', strokeWidth: 12}} d={pathAttr} />
            {/*
                joints.map((joint, index) => {
                    return <JointView key={index} index={index} x={joint.x} y={joint.y} 
                                      isActive={isActive && activeJointIndex === index}
                                      startDrag={createDragJointCallback && createDragJointCallback(joint)} />
                })
            */}
        </g>;
    }
}