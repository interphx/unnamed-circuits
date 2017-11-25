import { PlaceableId } from 'client/domain/placeable';

/*export type CustomModelId = string;
export interface CustomModel {
    id: CustomModelId;
    type: string;
    model: any;
}*/

export type CustomObjectId = string;
export class CustomObject {
    id: CustomObjectId;
    type: string;
    placeableId: string;

    constructor(id: CustomObjectId, type: string, placeableId: string) {
        this.id = id;
        this.type = type;
        this.placeableId = placeableId;
    }

    toPlainObject() {
        return JSON.parse(JSON.stringify(this));
    }

    static fromPlainObject(obj: any) {
        return Object.assign(new this(obj.id, obj.type, obj.placeableId), obj);
    }
}


/*
export class CustomObject {
    placeableId: PlaceableId;
    modelId: CustomModelId;

    constructor(placeableId: PlaceableId, modelId: CustomModelId) {
        this.placeableId = placeableId;
        this.modelId = modelId;
    }
}*/