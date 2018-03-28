export class BulkImmutableHandler {
    static proxyFor(obj) {
        const handler = new this(obj);
        return [handler.proxy, handler.freeze.bind(handler)];
    }

    constructor(obj) {
        if (obj === null || obj === undefined || (obj.constructor !== Object && obj.constructor !== Array)) {
            let typeName;
            if (obj === null) {
                typeName = "null";
            } else if (obj === undefined) {
                typeName = "undefined";
            } else {
                typeName = obj.constructor.name;
            }
            throw new Error(`Please provide an object, not "${typeName}"`);
        }
        this.dirty = true;
        this.cached = null;
        this.handlers = {};
        this.obj = obj;
        this.proxy = new Proxy(obj, this);
        this.forceSet = true;
        this.reAssign(this.proxy);
        this.forceSet = false;
    }

    reAssign(obj, makeImmutable=false) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        const constructor = obj.constructor;
        switch (constructor) {
            case Number:
            case String:
            case Boolean:
            case Function:
                break;
            case Object:
            case Array:
                for (const key in obj) {
                    obj[key] = this.reAssign(obj[key]);
                }
                break;
            default:
                throw new Error(`Unexpeted type "${constructor.name}"`);
        }

        return obj;
    }

    freeze() {
        if (this.isDirty()) {
            if (this.obj.constructor === Array) {
                this.cached = Array.from(this.obj);
            } else if (this.obj.constructor === Object) {
                this.cached = {...this.obj};
            } else {
                throw new Error(`Unexpeted object type "${this.obj.constructor.name}"`);
            }
            for (const key in this.handlers) {
                this.cached[key] = this.handlers[key].freeze();
            }
            this.dirty = false;
        }

        return this.cached;
    }

    isDirty() {
        if (this.dirty) {
            return true;
        }

        for (const key in this.handlers) {
            if (this.handlers[key].isDirty()) {
                return true;
            }
        }

        return false;
    }

    set(obj, prop, value) {
        if (!this.forceSet && (prop in obj) && (obj[prop] === value)) {
            return true;
        }
        let handler = null;
        if (value === null ) {
            //
        } else if (value === undefined) {
            //
        } else {
            const constructor = value.constructor;
            switch (constructor) {
                case Array:
                case Object:
                    handler = new BulkImmutableHandler(value);
                    value = handler.proxy;
                    break;
                case Number:
                case String:
                case Boolean:
                case Function:
                    break;
                default:
                    throw new Error(`Unexpeted type "${constructor.name}"`);
            }
        }
        obj[prop] = value;
        if (handler) {
            this.handlers[prop] = handler;
        } else {
            delete this.handlers[prop];
        }
        this.dirty = true;
        return true;
    }

    deleteProperty(obj, prop) {
        if (!(prop in obj)) {
            return true;
        }
        delete obj[prop];
        this.dirty = true;
        delete this.handlers[prop];
        return true;
    }
}
