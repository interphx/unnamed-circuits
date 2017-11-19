import * as React from 'react';
import { observer } from 'mobx-react';

import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

interface LevelTipsProps {
    x: number;
    y: number;
    width: number;
    height: number;
    lines?: string | string[];

    domainStore: DomainStore;
    uiStore: UIStore;
}

function LevelTipsViewBase({ domainStore, uiStore, x, y, width, height, lines }: LevelTipsProps) {
    if (!lines) {
        return null;
    }
    var actualLines = (typeof lines === 'string') ? [lines] : lines;

    let middleX = 0 + width / 2,
        middleY = 0 + height / 2;
    return <svg x={x} y={y} width={width} height={height} className="level-tip">
        {/*<rect x={0} y={0} width="100%" height="100%" fill="transparent" />*/}
        <text x={middleX} y={middleY} className="noselect" textAnchor="middle" alignmentBaseline="central">
            {
                actualLines.map((line, index) => <tspan key={index+line} x={middleX} y={20 + index * 16} textAnchor="middle" alignmentBaseline="central">{line}</tspan>)
            }
        </text>
    </svg>
}

export let LevelTipsView = observer(LevelTipsViewBase);