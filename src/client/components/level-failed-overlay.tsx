import * as React from 'react';
import { observer } from 'mobx-react';

import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

interface LevelFailedOverlayProps {
    text?: string;
    domainStore: DomainStore;
    uiStore: UIStore;
}

function LevelFailedOverlayViewBase({ domainStore, uiStore, text }: LevelFailedOverlayProps) {
    let middleX = 300 / 2,
        middleY = 128 / 2,
        quarterY = 128 / 4,
        lowQuareterY = 128 / 1.5;

    let lines = text ? text.split('\n') : [];

    return <svg x={100} y={0} width="100%" height="100%" className="level-failed-overlay">
        <rect x={0} y={0} width="100%" height="100%" fill="transparent" />



        <svg x={'7%'} y={'70%'} width={300} height={128} style={{cursor: 'default'}}>
            <rect fill="white" stroke="#330000" strokeWidth="2" x={0} y={0} width="100%" height="100%" />
            <text x={middleX} y={quarterY} 
                className="noselect"
                textAnchor="middle" alignmentBaseline="central"
            >
                Fail!
            </text>

            <text x={middleX} y={middleY - 10} className="noselect" textAnchor="middle" alignmentBaseline="central">
                {
                    lines.map((line, index) => 
                        <tspan key={index+line} x={middleX} y={middleY - 10 + index * 16} 
                               textAnchor="middle" alignmentBaseline="central">
                            {line}
                        </tspan>
                    )
                }
            </text>

            <svg style={{cursor: 'pointer'}} x={middleX - 64} y={lowQuareterY} width={128} height={32} onClick={() => domainStore.resetLevel()}>
                <rect fill="white" stroke="black" strokeWidth="1" x={0} y={0} width="100%" height="100%" />
                <text style={{cursor: 'pointer'}} x={128 - 64} y={16} 
                    className="noselect"
                    textAnchor="middle" alignmentBaseline="central"
                >
                    Restart
                </text>
            </svg>
        </svg>
    </svg>
}

export let LevelFailedOverlayView = observer(LevelFailedOverlayViewBase);