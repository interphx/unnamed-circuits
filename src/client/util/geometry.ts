export function distanceBetweenPoints(ax: number, ay: number, bx: number, by: number) {
    let dx = bx - ax,
        dy = by - ay;
    return Math.sqrt(dx*dx + dy*dy);
}

export function distanceFromPointToLine(
    pointX: number, pointY: number,
    lineStartX: number, lineStartY: number,
    lineEndX: number, lineEndY: number
) {
    let lineDX = lineEndX - lineStartX,
        lineDY = lineEndY - lineStartY;
    let lineLength = Math.sqrt(lineDX*lineDX + lineDY*lineDY);

    // Comparing to 0 should be okay here, right?
    if (lineLength === 0) {
        return distanceBetweenPoints(pointX, pointY, lineStartX, lineStartY);
    }

    let numerator = Math.abs(lineDY * pointX - lineDX * pointY + lineEndX*lineStartY - lineEndY*lineStartX);
    return numerator / lineLength;
}