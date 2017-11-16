import { observable } from "mobx";

export interface Vec2Like {
    x: number;
    y: number;
}

export class Vec2 {
    @observable public x: number;
    @observable public y: number;    

    constructor(
        x: number, 
        y: number
    ) {
        this.x = x;
        this.y = y;
    }

    isEqualTo(other: Vec2) {
        return (this.x === other.x) && (this.y === other.y);
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    snapTo(step: number, startOffset: number = 0) {
        this.x = Math.floor(this.x / step) * step + startOffset;
        this.y = Math.floor(this.y / step) * step + startOffset;
    }

    distanceTo(other: Vec2Like): number { 
        let dx = this.x - other.x,
            dy = this.y - other.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    setFrom(other: Vec2Like) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    addXY(x: number, y: number) {
        this.x += x;
        this.y += y;
        return this;
    }

    addVec2(other: Vec2) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    subXY(x: number, y: number) {
        this.x -= x;
        this.y -= y;
        return this;
    }

    subVec2(other: Vec2) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    scale(k: number) {
        this.x *= k;
        this.y *= k;
        return this;
    }

    dotXY(x: number, y: number) {
        return this.x * x + this.y * y;
    }

    dotVec2(other: Vec2) {
        return this.x * other.x + this.y * other.y;
    }

    static fromCartesian(x: number, y: number) {
        return new Vec2(x, y);
    }

    static fromPolar(radius: number, angleRadians: number) {
        let x = Math.cos(angleRadians) * radius,
            y = Math.sin(angleRadians) * radius;
        
        return new Vec2(x, y);
    }

    static zero() {
        return new Vec2(0, 0);
    }

    static toPlainObject(vec2: Vec2) {
        return {x: vec2.x, y: vec2.y};
    }

    static fromPlainObject(obj: any) {
        return Vec2.fromCartesian(obj.x, obj.y);
    }
}