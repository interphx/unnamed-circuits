import { EntityStore } from 'client/domain/stores/entity-store';
import { Endpoint, EndpointType } from 'client/domain/endpoint';
import { getRandomId } from 'shared/utils';
import { GateId } from 'client/domain/gate';

export class EndpointsStore extends EntityStore<Endpoint> {
    create(type: EndpointType, gateId: GateId) {
        let entity = new Endpoint(
            getRandomId(10),
            type,
            gateId
        );
        this.add(entity);
        return entity;
    }
}