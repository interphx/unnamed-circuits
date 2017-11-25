import * as React from 'react';
import { CustomObject } from 'client/domain/custom';
import { Placeable } from 'client/domain/placeable';

interface CustomObjectViewProps { 
    customObject: CustomObject, 
    placeable: Placeable
}

export type CustomObjectReactView 
    = React.ComponentClass<CustomObjectViewProps> | React.StatelessComponent<CustomObjectViewProps>;

export class CustomViewsRepository {
    views: Map<string, CustomObjectReactView> = new Map();

    constructor() {

    }

    register(name: string, view: CustomObjectReactView) {
        this.views.set(name, view);
    }

    get(name: string): CustomObjectReactView {
        let result = this.views.get(name);
        if (!result) {
            throw new Error(`Custom view not found: ${name}`);
        }
        return result;
    }
}