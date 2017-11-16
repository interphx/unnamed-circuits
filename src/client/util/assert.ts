export function assert(condition: any, message: string = 'Assertion failed') {
    if (!condition) {
        throw new Error(message);
    }
}