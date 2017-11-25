import * as React from 'react';
import { observer } from 'mobx-react';

import { Vec2 } from 'client/domain/vec2';
import { CustomObject } from 'client/domain/custom';
import { Placeable } from 'client/domain/placeable';
import { MazeCustomObject } from 'client/levels/robotics/maze/maze-custom-object';

interface MazeViewProps {
    customObject: MazeCustomObject;
    placeable: Placeable;
}


export let MazeViewBase = function MazeView({ customObject, placeable }: MazeViewProps) {
    let cellSize = 12,
        maze = customObject.maze,
        playerRotation = ({'north': 0, 'east': 90, 'south': 180, 'west': 270})[maze.playerDirection];

    return (
        <svg x={placeable.pos.x} y={placeable.pos.y} data-element-type="custom-object">
            <rect x={0} y={0} width={maze.width * cellSize} height={maze.height*cellSize} />
            {
                maze.data.map((value, index) => {
                    let cellX = index % maze.width,
                        cellY = Math.floor(index / maze.width),
                        x = cellX * cellSize,
                        y = cellY * cellSize,
                        color = maze.isGoal(cellX, cellY) ? 'green' : (value ? 'black' : 'white');
                    return <rect key={index} x={x} y={y} width={cellSize} height={cellSize} fill={color} stroke='none' />
                })
            }
            <path x={0} y={0} transform={`translate(${maze.playerPos.x * cellSize} ${maze.playerPos.y * cellSize}) rotate(${playerRotation} ${cellSize/2} ${cellSize/2})`} d={`M ${0},${cellSize} L ${cellSize/2} 0 L ${cellSize},${cellSize} Z`} fill="blue" />
        </svg>
    );
}

export let MazeView = observer(MazeViewBase);