export function omit<T>(obj: T, keys: (keyof T)[]) {
    let result = Object.assign({}, obj);
    for (let key of keys) {
        delete result[key];
    }
    return result;
}