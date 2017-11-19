import * as React from 'react';
import { observer } from 'mobx-react';

import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

interface LevelRunningOverlayProps {
    visible: boolean;
    domainStore: DomainStore;
    uiStore: UIStore;
}

function LevelRunningOverlayViewBase({ domainStore, uiStore, visible }: LevelRunningOverlayProps) {
    if (!visible) {
        return null;
    }
    return <svg x={100} y={0} width="100%" height="100%" className="level-running-overlay">
        <rect x={0} y={0} width="100%" height="100%" fill="transparent" />
        <text x="10%" y="80%" style={{fontSize: 32}}>Running...</text>
    </svg>
}

export let LevelRunningOverlayView = observer(LevelRunningOverlayViewBase);