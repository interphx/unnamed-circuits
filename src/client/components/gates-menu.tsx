import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { Gate } from 'client/domain/gate';
import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';
import { clamp } from 'client/util/math';

export interface GatesMenuProps {
    gateTypes: string[];
    levelRunning: boolean;
    setGroupRef: (element?: SVGGElement | null) => void;
    createCreateAndStartDragCallback: (gateType: string) => (event: React.MouseEvent<any> | PointerEvent) => void;
    resetLevel: () => void;
    startLevel: () => void;
    showLevelMenu: () => void;
    //domainStore: DomainStore;
    //uiStore: UIStore;
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
        let {levelRunning, resetLevel, startLevel } = this.props;
        if (levelRunning) {
            resetLevel();
        } else {
            startLevel();
        }
    }

    handleMouseWheel(event: React.WheelEvent<any>) {
        event.stopPropagation();
        let delta = -Math.sign(event.deltaY);
        this.setState({
            scrollAmount: clamp(this.state.scrollAmount + delta * 20, -(64 + 10) * this.props.gateTypes.length, 0)
        });
    }

    handleMenuMouseDown(event: React.MouseEvent<any> | PointerEvent) {
        event.stopPropagation();
    }

    handleMenuClick() {
        this.props.showLevelMenu();
    }

    render() {
        let { setGroupRef, createCreateAndStartDragCallback, levelRunning } = this.props;

        let gateWidth = 96,
            gateHeight = 64,
            menuBaseWidth = gateWidth,
            padLeft = 10,
            padRight = 10,
            padTop = 10,
            padBetween = 10,
            levelControlButtonHeight = 48,
            menuFullWidth = menuBaseWidth + padLeft + padRight;

        return (
            <svg 
                className="gates-menu"
                ref={this.props.setGroupRef} 
                onWheel={this.handleMouseWheel}
                onMouseDown={this.handleMenuMouseDown}
            >
                <rect x={0} y={0} width={menuFullWidth} height={'100%'} fill="white" stroke="#000" strokeWidth={1} />
                {
                    this.props.gateTypes.map( (gateType, index) => {
                        let containerY = padTop + (gateHeight + padBetween) * index + this.state.scrollAmount,
                            middleX = 0 + gateWidth / 2,
                            middleY = 0 + gateHeight / 2;
                        return <svg onMouseDown={createCreateAndStartDragCallback(gateType)} key={gateType} className="grabbable" x={padLeft} y={containerY} width={gateWidth} height={gateHeight}>
                            <rect x={0} y={0} width={gateWidth} height={gateHeight} style={{ fill: "white", stroke: '#000', strokeWidth: 2 }} />
                            <text x={middleX} y={middleY} className="grabbable noselect" textAnchor="middle" alignmentBaseline="central">{ gateType }</text>
                        </svg>
                    })
                }
                <svg x={0} y={'80%'} width={menuFullWidth} height='20%'>
                    <rect x={0} y={0} width='100%' height='100%' fill="white" />
                    <svg className="svg-button" x={padLeft} y={0} width={gateWidth} height={levelControlButtonHeight} onClick={this.handleLevelControlClick}>
                        <rect x={0} y={0} width={gateWidth} height={levelControlButtonHeight} fill="white" />
                        <text x={gateWidth/2} y={levelControlButtonHeight/2} className="svg-button noselect" textAnchor="middle" alignmentBaseline="central">{ levelRunning ? 'Stop' : 'Start' }</text>
                    </svg>
                    <svg className="svg-button" x={padLeft} y={levelControlButtonHeight + 10} width={gateWidth} height={levelControlButtonHeight} onClick={this.handleMenuClick}>
                        <rect x={0} y={0} width={gateWidth} height={levelControlButtonHeight} fill="white" />
                        <text x={gateWidth/2} y={levelControlButtonHeight/2} className="svg-button__text noselect" textAnchor="middle" alignmentBaseline="central">Menu</text>
                    </svg>
                </svg>
            </svg>
        );
    }
}