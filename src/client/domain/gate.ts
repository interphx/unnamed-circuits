import { Vec2 } from 'client/domain/vec2';
import { observable } from 'mobx';
import { omit } from 'client/util/obj';
import { validateObject } from 'client/util/validation';
import { BoardId } from 'client/domain/board';
import { Endpoint } from 'client/domain/endpoint';

export type GateId = string;

export class Gate {
    static initialInputsCount: number = 0;
    static initialOutputsCount: number = 0;

    id: GateId;
    boardId: BoardId;
    deletable: boolean = true;
    @observable name: string;
    @observable pos: Vec2;
    @observable rotation: number;

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        this.id = id;
        this.boardId = boardId;
        this.pos = pos;
        this.rotation = rotation;
        this.name = this.constructor.name;
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {

    }

    toPlainObject() {
        let result: {[key: string]: any} = {
            $type: this.constructor.name,
            id: this.id,
            boardId: this.boardId,
            pos: {x: this.pos.x, y: this.pos.y},
            rotation: this.rotation
        };

        let excludedFields = ['id', 'boardId', 'pos', 'rotation', '$type'];

        for (let key in this) {
            if (this.hasOwnProperty(key) && excludedFields.indexOf(key) < 0) {
                result[key] = JSON.parse(JSON.stringify(this[key]));
            }
        }

        return result;
    }

    static toPlainObject(gate: Gate) {
        return gate.toPlainObject();
    }

    static fromPlainObject(obj: any) {
        validateObject(obj, ['$type', 'id', 'pos', 'rotation']);

        let id = obj.id,
            boardId = obj.boardId,
            posData = obj.pos,
            rotation = obj.rotation,
            type = obj.$type as GateType,
            result = new GateClasses[type](id, boardId, Vec2.fromCartesian(posData.x, posData.y), rotation);

        let excludedFields = ['id', 'boardId', 'pos', 'rotation', '$type'];

        Object.assign(result, omit(obj, excludedFields));
        
        return result;
    }

    static fromTypeName(gateType: GateType, id: GateId, boardId: BoardId, position: Vec2, rotation: number) {
        return new GateClasses[gateType](id, boardId, position, rotation);
    }
}


export class Not extends Gate {
    static initialInputsCount = 1;
    static initialOutputsCount = 1;

    name = 'Not';

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        super(id, boardId, pos, rotation);
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {
        outputs[0].value = inputs[0].value > 0.5 ? 0 : 1;
    }
}

export class And extends Gate {
    static initialInputsCount = 2;
    static initialOutputsCount = 1;

    name = 'And';

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        super(id, boardId, pos, rotation);
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {
        outputs[0].value = inputs.reduce((product, curr) => curr.value && product, 1);
    }
}

export class Or extends Gate {
    static initialInputsCount = 2;
    static initialOutputsCount = 1;

    name = 'Or';

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        super(id, boardId, pos, rotation);
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {
        outputs[0].value = inputs.reduce((sum, curr) => curr.value || sum, 0);
    }
}

export class In extends Gate {
    static initialInputsCount = 1;
    static initialOutputsCount = 0;
    deletable = false;

    name = 'In';
}

export class Out extends Gate {
    static initialInputsCount = 0;
    static initialOutputsCount = 1;
    deletable = false;

    name = 'Out';
}

export class Nand extends Gate {
    static initialInputsCount = 2;
    static initialOutputsCount = 1;

    name = 'NAND';

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        super(id, boardId, pos, rotation);
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {
        outputs[0].value = inputs.reduce((product, curr) => curr.value && product, 1) > 0.5 ? 0 : 1;
    }
}

export class Nor extends Gate {
    static initialInputsCount = 2;
    static initialOutputsCount = 1;

    name = 'NOR';

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        super(id, boardId, pos, rotation);
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {
        outputs[0].value = inputs.reduce((sum, curr) => curr.value || sum, 0) > 0.5 ? 0 : 1;
    }
}

export class Xor extends Gate {
    static initialInputsCount = 2;
    static initialOutputsCount = 1;

    name = 'XOR';

    constructor(id: GateId, boardId: BoardId, pos: Vec2, rotation: number) {
        super(id, boardId, pos, rotation);
    }

    update(inputs: Endpoint[], outputs: Endpoint[], dtSeconds: number, currentTimeSeconds: number) {
        outputs[0].value = inputs[0].value !== inputs[1].value ? 1 : 0;
    }
}

export let GateClasses = {
    Not: Not,
    And: And,
    Or: Or,
    Nand: Nand,
    Nor: Nor,
    Xor: Xor,
    In: In,
    Out: Out
};

export type GateType = keyof typeof GateClasses;

export let GateTypes = Object.keys(GateClasses) as GateType[];

