export function validateObject(obj: any, fields: string[]): void {
    if (!obj) {
        throw new Error('Object is falsy');
    }
    for (let field of fields) {
        if (!obj.hasOwnProperty(field)) {
            throw new Error(`Field "${field}" is absent in object`);
        }
    }
}