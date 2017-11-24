import { PlaceableId } from 'client/domain/placeable';

export type CustomModelId = string;
export interface CustomModel {
    id: CustomModelId;
    type: string;
    model: any;
}

export class CustomObject {
    placeableId: PlaceableId;
    modelId: CustomModelId;

    constructor(placeableId: PlaceableId, modelId: CustomModelId) {
        this.placeableId = placeableId;
        this.modelId = modelId;
    }
}