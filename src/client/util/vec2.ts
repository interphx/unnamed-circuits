import { observable } from "mobx";

export interface Vec2 {
    x: number;
    y: number;
}

export module Vec2 {
    export function equal(a: Vec2, b: Vec2): boolean {
        return (a.x === b.x) && (a.y === b.y);
    }

    export function clone(vec2: Vec2): Vec2 {
        return {x: vec2.x, y: vec2.y};
    }

    export function snapTo(vec2: Vec2, step: number, startOffset: number = 0) {
        vec2.x = Math.round(vec2.x / step) * step + startOffset;
        vec2.y = Math.round(vec2.y / step) * step + startOffset;
        return vec2;
    }

    export function setFrom(destination: Vec2, source: Vec2) {
        destination.x = source.x;
        destination.y = source.y;
        return destination;
    }

    export function addVec2(destination: Vec2, source: Vec2) {
        destination.x += source.x;
        destination.y += source.y;
        return destination;
    }

    export function addCartesian(destination: Vec2, x: number, y: number) {
        destination.x += x;
        destination.y += y;
        return destination;
    }

    export function subVec2(destination: Vec2, source: Vec2) {
        destination.x -= source.x;
        destination.y -= source.y;
        return destination;
    }

    export function subCartesian(destination: Vec2, x: number, y: number) {
        destination.x -= x;
        destination.y -= y;
        return destination;
    }

    export function scale(vec2: Vec2, k: number) {
        vec2.x *= k;
        vec2.y *= k;
        return vec2;
    }

    export function dotCartesian(vec2: Vec2, x: number, y: number) {
        return vec2.x * x + vec2.y * y;
    }

    export function dotVec2(a: Vec2, b: Vec2) {
        return a.x * b.x + a.y * b.y;
    }

    export function  fromCartesian(x: number, y: number): Vec2 {
        return {x, y};
    }

    export function  fromPolar(radius: number, angleRadians: number): Vec2 {
        let x = Math.cos(angleRadians) * radius,
            y = Math.sin(angleRadians) * radius;
        
        return {x, y};
    }

    export function zero(): Vec2 {
        return {x: 0, y: 0};
    }

    export function toPlainObject(vec2: Vec2) {
        return {x: vec2.x, y: vec2.y};
    }

    export function fromPlainObject(obj: any) {
        return Vec2.fromCartesian(obj.x, obj.y);
    }
}