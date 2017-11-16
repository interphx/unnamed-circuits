import * as React from 'react';

export type PointersDown = Map<number, {x: number, y: number}>;

export interface PointerEventsOptions {
    minDragDistance: number;
}

let defaultOptions: PointerEventsOptions = {
    minDragDistance: 0
};

export function withPointerEvents<TProps, T extends React.ComponentClass<TProps>>(
    userOptions?: Partial<PointerEventsOptions>
) {
    let options = Object.assign({}, defaultOptions, userOptions);
    return function(Wrapped: T) {
        return class WithPointerEvents extends (Wrapped as any) {
    
            $pointersDown: PointersDown = new Map();

            $onPointerDown = (event: PointerEvent) => {
                this.$pointersDown.set(event.pointerId, { x: event.clientX, y: event.clientY });

                document.addEventListener('pointermove', this.$onPointerDrag);
                document.addEventListener('pointerup', this.$onPointerUp);
                document.addEventListener('pointercancel', this.$onPointerUp);
                document.addEventListener('pointerleave', this.$onPointerUp);

                if (this.handlePointerDown) {
                    this.handlePointerDown(event, this.$pointersDown);
                }
            }

            $onPointerDrag = (event: PointerEvent) => {
                if (this.handlePointerDrag) {
                    this.handlePointerDrag(event, this.$pointersDown);
                }

                let pos = this.$pointersDown.get(event.pointerId);
                pos!.x = event.clientX;
                pos!.y = event.clientY;
            }

            $onPointerUp = (event: PointerEvent) => {
                document.removeEventListener('pointermove', this.$onPointerDrag);
                document.removeEventListener('pointerup', this.$onPointerUp);
                document.removeEventListener('pointercancel', this.$onPointerUp);
                document.removeEventListener('pointerleave', this.$onPointerUp);

                if (this.handlePointerUp) {
                    this.handlePointerUp(event, this.$pointersDown);
                }

                this.$pointersDown.delete(event.pointerId);
            }

            componentDidMount() {
                if (this.container) {
                    this.container.addEventListener('pointerdown', this.$onPointerDown);
                }
                if (super.componentDidMount) {
                    super.componentDidMount();
                }
            }

            componentWillUnmount() {
                document.removeEventListener('pointerdown', this.$onPointerDown);
                document.removeEventListener('pointermove', this.$onPointerDrag);
                document.removeEventListener('pointerup', this.$onPointerUp);
                document.removeEventListener('pointercancel', this.$onPointerUp);
                document.removeEventListener('pointerleave', this.$onPointerUp);
                if (super.componentWillUnmount) {
                    super.componentWillUnmount();
                }
            }

            render() {
                return super.render();
            }
        } as any as T;
    }
}