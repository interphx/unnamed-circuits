import { EntityStore } from 'client/domain/stores/entity-store';
import { Connection } from 'client/domain/connection';
import { EndpointId } from 'client/domain/endpoint';
import { getRandomId } from 'shared/utils';

export class ConnectionsStore extends EntityStore<Connection> {
    create(from?: EndpointId, to?: EndpointId) {
        let entity = new Connection(
            getRandomId(10)
        );
        if (from) entity.endpointA = from;
        if (to) entity.endpointB = to;
        this.add(entity);
        return entity;
    }
}