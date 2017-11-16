export interface Ticks {
    type: 'ticks';
    value: number;
}

export interface Seconds {
    type: 'seconds';
    value: number;
}

export type Duration = Ticks | Seconds;

export function makeTicks(value: number): Ticks {
    return { type: 'ticks', value };
}

export function makeSeconds(value: number): Seconds {
    return { type: 'seconds', value };
}