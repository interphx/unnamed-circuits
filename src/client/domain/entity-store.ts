import { observable } from 'mobx';

import { WithId } from 'client/interfaces/with-id';

export class EntityStore<T extends WithId> {
    entities = observable.map<T>({});

    constructor() {

    }

    add(entity: T) {
        this.entities.set(entity.id, entity);
    }

    remove(entityId: string) {
        this.entities.delete(entityId);
    }

    findBy<Field extends keyof T>(field: Field, value: T[Field]) {
        return this.find(entity => entity[field] === value);
    }

    find(predicate: (entity: T) => boolean) {
        return this.getAll().find(predicate);
    }

    findAll(predicate: (entity: T) => boolean) {
        return this.getAll().filter(predicate);
    }

    getById(id: string) {
        if (!this.entities.has(id)) {
            throw new Error(`Unable to get entity by id: ${id}`);
        }
        return this.entities.get(id)!;
    }

    getAll(): ReadonlyArray<T> {
        return this.entities.values();
    }

    toPlainObject() {
        throw new Error(`toPlainOBject not implemented for EntityStore`);
    }
}