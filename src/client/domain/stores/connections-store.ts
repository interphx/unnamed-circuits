import { EntityStore } from 'client/domain/stores/entity-store';
import { Connection } from 'client/domain/connection';
import { EndpointId } from 'client/domain/endpoint';
import { getRandomId } from 'shared/utils';
import { Vec2 } from 'client/util/vec2';

export class ConnectionsStore extends EntityStore<Connection> {
    create(computePath: (a: Vec2, b: Vec2) => Vec2[], from?: EndpointId, to?: EndpointId) {
        let entity = new Connection(
            getRandomId(10),
            computePath
        );
        if (from) entity.output = from;
        if (to) entity.input = to;
        this.add(entity);
        return entity;
    }
}