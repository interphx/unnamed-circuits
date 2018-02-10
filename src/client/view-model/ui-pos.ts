import { Vec2 } from 'client/util/vec2';

export interface UIPos {
    type: 'screen' | 'board';
    pos: Vec2;
}