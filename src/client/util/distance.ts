export function euclidean(ax: number, ay: number, bx: number, by: number) {
    let dx = ax - bx,
        dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

export function manhattan(ax: number, ay: number, bx: number, by: number) {
    let dx = ax - bx,
        dy = ay - by;
    return Math.abs(dx) + Math.abs(dy);
}

export function chebyshev(ax: number, ay: number, bx: number, by: number) {
    let dx = ax - bx,
        dy = ay - by;
    return Math.max(Math.abs(dx), Math.abs(dy));
}