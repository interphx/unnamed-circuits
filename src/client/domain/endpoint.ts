import { observable } from 'mobx';

import { GateId } from 'client/domain/gate';
import { getPlainOwnProperties } from 'client/util/plain';
import { validateObject } from 'client/util/validation';

export type EndpointId = string;
export type EndpointType = 'input' | 'output';
export class Endpoint {
    readonly id: EndpointId;
    readonly type: EndpointType;
    readonly gateId: GateId;
    @observable
    offset: number;
    @observable
    value: number;

    tag: string;

    constructor(id: EndpointId, type: EndpointType, gateId: GateId) {
        this.id = id;
        this.type = type;
        this.gateId = gateId;
        this.offset = 0;
        this.value = 0;
    }

    toPlainObject() {
        return getPlainOwnProperties(this);
    }

    static toPlainObject(endpoint: Endpoint) {
        return endpoint.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['id', 'type', 'gateId', 'offset']);
        let result = new Endpoint(obj.id, obj.type, obj.gateId);
        if (obj.offset != null) {
            result.offset = obj.offset;
        }
        return result;
    }
}