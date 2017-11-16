import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Gate } from 'client/domain/gate';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

export interface GatesMenuProps {
    gateClasses: string[];
    setGroupRef: (element?: SVGGElement | null) => void;

    domainStore: DomainStore;
    uiStore: UIStore;
}

export interface GatesMenuState {
    
}

@observer
export class GatesMenuView extends BaseComponent<GatesMenuProps, GatesMenuState> {
    constructor(props: GatesMenuProps) {
        super(props);
        this.state = {
            
        }
    }

    handleLevelControlClick() {
        let { domainStore, uiStore } = this.props;
        if (domainStore.isCurrentLevelRunning()) {
            domainStore.resetLevel();
        } else {
            domainStore.resumeLevel();
        }
    }

    render() {
        let { domainStore, uiStore } = this.props;

        let gateWidth = 96,
            gateHeight = 64,
            menuBaseWidth = gateWidth,
            padLeft = 10,
            padRight = 10,
            padTop = 10,
            padBetween = 10,
            levelControlButtonHeight = 48;

        return <g className="gates-menu" data-element-type="gates-menu" ref={this.props.setGroupRef}>
            <rect x={0} y={0} width={menuBaseWidth + padLeft + padRight} height={'100%'} fill="white" stroke="#000" strokeWidth={1} />
            {
                this.props.gateClasses.map( (gateClassName, index) => {
                    let containerY = padTop + (gateHeight + padBetween) * index,
                        middleX = 0 + gateWidth / 2,
                        middleY = 0 + gateHeight / 2;
                    return <svg key={gateClassName} className="grabbable" x={padLeft} y={containerY} width={gateWidth} height={gateHeight} data-element-type="menu-gate-button" data-gate-type={gateClassName}>
                        <rect x={0} y={0} width={gateWidth} height={gateHeight} style={{ fill: "white", stroke: '#000', strokeWidth: 2 }} />
                        <text x={middleX} y={middleY} className="grabbable noselect" textAnchor="middle" alignmentBaseline="central">{ gateClassName }</text>
                    </svg>
                })
            }
            <svg x={padLeft} y={'80%'} width={gateWidth} height={levelControlButtonHeight} onClick={this.handleLevelControlClick}>
                <rect x={0} y={0} width={gateWidth} height={levelControlButtonHeight} fill="white" />
                <text x={gateWidth/2} y={levelControlButtonHeight/2} className="noselect" textAnchor="middle" alignmentBaseline="central">{ domainStore.isCurrentLevelRunning() ? 'Stop' : 'Start' }</text>
            </svg>
        </g>
    }
}