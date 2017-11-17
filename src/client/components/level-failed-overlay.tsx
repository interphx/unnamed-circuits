import * as React from 'react';
import { observer } from 'mobx-react';

import { DomainStore } from 'client/domain/domain-store';
import { UIStore } from 'client/view-model/ui-store';

interface LevelFailedOverlayProps {
    visible: boolean;
    text?: string;
    domainStore: DomainStore;
    uiStore: UIStore;
}

function LevelFailedOverlayViewBase({ domainStore, uiStore, visible, text }: LevelFailedOverlayProps) {
    if (!visible) {
        return null;
    }
    return <svg x={100} y={0} width="100%" height="100%" className="level-failed-overlay">
        <rect x={0} y={0} width="100%" height="100%" fill="transparent" />




        <svg x={20} y={'10%'} width={300} height={128}>
            <switch>
                <foreignObject x="0" y="0" width={300} height={128}>
                    <div style={{
                            boxSizing: 'border-box', 
                            border: '1px solid black', 
                            background: 'white', 
                            width: '300px', 
                            height: '128px'
                        }}
                    >
                        <button style={{  }} onClick={() => { domainStore.resetLevel() }}>Reset</button>
                        <button style={{  }} onClick={() => { domainStore.startLevel() }}>Replay</button>
                    </div>
                </foreignObject>

                <text x="20" y="20">Your SVG viewer cannot display html.</text>
            </switch>
        </svg>
    </svg>
}

export let LevelFailedOverlayView = observer(LevelFailedOverlayViewBase);