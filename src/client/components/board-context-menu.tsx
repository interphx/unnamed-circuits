import * as React from 'react';
import { observer } from 'mobx-react';

import { BaseComponent } from 'client/base';
import { BoardContextMenuItem } from 'client/view-model/context-menu';

export interface BoardContextMenuProps {
    x: number;
    y: number;
    items: BoardContextMenuItem[];
}

export interface BoardContextMenuState {
    
}

@observer
export class BoardContextMenuView extends BaseComponent<BoardContextMenuProps, BoardContextMenuState> {

    constructor(props: BoardContextMenuProps) {
        super(props);
        this.state = {
            
        }
    }

    render() {
        let { x, y, items } = this.props;

        let padding = 6,
            itemHeight = 18,
            maxItemLength = items.reduce((max, item) => item.caption.length > max ? item.caption.length : max, 0),
            itemWidth = maxItemLength * 14,
            height = padding * 2 + itemHeight * items.length,
            width = padding * 2 + itemWidth,
            
            textPaddingLeft = 4;

        return (
            <svg
                x={x}
                y={y}
                width={width}
                height={height}
                className="context-menu"
            >
                <rect className="context-menu__shadow" x={5} y={5} width='100%' height='100%' />
                <rect className="context-menu__background" x={0} y={0} width='100%' height='100%' stroke='#999' strokeWidth={1} />
                {
                    items.map((item, index) => (
                        <svg className="context-menu__item" key={item.caption+index} x={padding} y={padding + index * itemHeight} width={itemWidth} height={itemHeight} onMouseDown={item.onClick}>
                            <rect className="context-menu__item-background" x={0} y={0} width='100%' height='100%'/>
                            <text className="context-menu__item-text" x={textPaddingLeft} y={itemHeight / 2} alignmentBaseline="central">{item.caption}</text>
                        </svg>
                    ))
                }
            </svg>
        );
    }
}