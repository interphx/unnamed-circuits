import * as React from 'react';

import { UIArrow } from 'client/view-model/ui-arrow';
import { Vec2 } from 'client/util/vec2';


export function UIArrowView({screenPosStart, screenPosEnd}: {screenPosStart: Vec2, screenPosEnd: Vec2}) {

    let arrowheadAngle = Math.atan2(screenPosEnd.y, screenPosEnd.x);

    return <React.Fragment>
        <line 
            x1={screenPosStart.x}
            y1={screenPosStart.y}
            x2={screenPosEnd.x}
            y2={screenPosEnd.y}
            stroke={'#333'}
            strokeWidth={2}
            markerEnd='url(#marker-triangle)' />
    </React.Fragment>
}