import * as React from 'react';

type ReactView = React.ComponentClass<any> | React.StatelessComponent<any>;

export class CustomViewsRepository {
    views: Map<string, ReactView> = new Map();

    constructor() {

    }

    register(name: string, view: ReactView) {
        this.views.set(name, view);
    }

    get(name: string): ReactView {
        let result = this.views.get(name);
        if (!result) {
            throw new Error(`Custom view not found: ${name}`);
        }
        return result;
    }
}