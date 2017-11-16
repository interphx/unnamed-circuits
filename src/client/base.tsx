import * as React from 'react';

export interface BaseComponentProps {
    
}

export interface BaseComponentState {
    
}

export abstract class BaseComponent<TProps, TState> extends React.Component<TProps & BaseComponentProps, TState & BaseComponentState> {
    constructor(props: TProps & BaseComponentProps) {
        super(props);
        this.bindHandlers();
    }

    bindHandlers() {
        for (var key in this) {
            var value = this[key] as any;
            if (value instanceof Function && key.startsWith('handle')) {
              this[key] = value.bind(this);
            }
        }
    }

    handleInputChange(event: React.SyntheticEvent<any>) {
        var element = event.target as HTMLInputElement,
            name = element.name,
            value = (element instanceof HTMLInputElement && element.type === 'checkbox') 
                ? element.checked 
                : element.value as any;
        
        if (!name) {
           console.warn(`Attempt to handle input on an unnamed element`, element);
           return;
        }

        this.setState({ [name as any]: value });
    }

    preventDefault(event: React.SyntheticEvent<any>) {
        event.preventDefault();
    }

    stopPropagation(event: React.SyntheticEvent<any>) {
        event.stopPropagation();
    }

    preventAndStop(event: React.SyntheticEvent<any>) {
        event.preventDefault();
        event.stopPropagation();
    }
}