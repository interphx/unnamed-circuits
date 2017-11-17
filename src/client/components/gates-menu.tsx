import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Gate } from 'client/domain/gate';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { clamp } from 'client/util/math';

export interface GatesMenuProps {
    gateClasses: string[];
    setGroupRef: (element?: SVGGElement | null) => void;

    domainStore: DomainStore;
    uiStore: UIStore;
}

export interface GatesMenuState {
    scrollAmount: number;
}

@observer
export class GatesMenuView extends BaseComponent<GatesMenuProps, GatesMenuState> {
    constructor(props: GatesMenuProps) {
        super(props);
        this.state = {
            scrollAmount: 0
        }
    }

    handleLevelControlClick() {
        let { domainStore, uiStore } = this.props;
        if (domainStore.isCurrentLevelRunning()) {
            domainStore.resetLevel();
        } else {
            domainStore.startLevel();
        }
    }

    handleMouseWheel(event: React.WheelEvent<any>) {
        let delta = -Math.sign(event.deltaY);
        this.setState({
            scrollAmount: clamp(this.state.scrollAmount + delta * 20, -(64 + 10) * this.props.gateClasses.length, 0)
        });
    }

    handleMenuClick() {
        this.props.uiStore.showLevelMenu();
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
            levelControlButtonHeight = 48,
            menuFullWidth = menuBaseWidth + padLeft + padRight;

        return <svg className="gates-menu" data-element-type="gates-menu" ref={this.props.setGroupRef} onWheel={this.handleMouseWheel}>
            <rect x={0} y={0} width={menuFullWidth} height={'100%'} fill="white" stroke="#000" strokeWidth={1} />
            {
                this.props.gateClasses.map( (gateClassName, index) => {
                    let containerY = padTop + (gateHeight + padBetween) * index + this.state.scrollAmount,
                        middleX = 0 + gateWidth / 2,
                        middleY = 0 + gateHeight / 2;
                    return <svg key={gateClassName} className="grabbable" x={padLeft} y={containerY} width={gateWidth} height={gateHeight} data-element-type="menu-gate-button" data-gate-type={gateClassName}>
                        <rect x={0} y={0} width={gateWidth} height={gateHeight} style={{ fill: "white", stroke: '#000', strokeWidth: 2 }} />
                        <text x={middleX} y={middleY} className="grabbable noselect" textAnchor="middle" alignmentBaseline="central">{ gateClassName }</text>
                    </svg>
                })
            }
            <svg x={0} y={'80%'} width={menuFullWidth} height='20%'>
                <rect x={0} y={0} width='100%' height='100%' fill="white" />
                <svg className="svg-button" x={padLeft} y={0} width={gateWidth} height={levelControlButtonHeight} onClick={this.handleLevelControlClick}>
                    <rect x={0} y={0} width={gateWidth} height={levelControlButtonHeight} fill="white" />
                    <text x={gateWidth/2} y={levelControlButtonHeight/2} className="svg-button noselect" textAnchor="middle" alignmentBaseline="central">{ domainStore.isCurrentLevelRunning() ? 'Stop' : 'Start' }</text>
                </svg>
                <svg className="svg-button" x={padLeft} y={levelControlButtonHeight + 10} width={gateWidth} height={levelControlButtonHeight} onClick={this.handleMenuClick}>
                    <rect x={0} y={0} width={gateWidth} height={levelControlButtonHeight} fill="white" />
                    <text x={gateWidth/2} y={levelControlButtonHeight/2} className="svg-button__text noselect" textAnchor="middle" alignmentBaseline="central">Menu</text>
                </svg>
            </svg>
        </svg>
    }
}