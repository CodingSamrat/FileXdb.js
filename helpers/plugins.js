export function prettify() {
    Object.defineProperty(Object.prototype, 'prettify', {
        value: function () {
            return JSON.stringify(this, null, 2);
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}