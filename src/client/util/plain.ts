export function getPlainOwnProperties(obj: {[key: string]: any}) {
    let ownProps: {[key: string]: any} = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            ownProps[key] = obj[key];
        }
    }
    return JSON.parse(JSON.stringify(ownProps));
}