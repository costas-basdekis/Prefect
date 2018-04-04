import { CombinedReducer } from './combined.js'
import { BulkImmutableHandler } from '../BulkImmutable.js'

export class CombinedImmutableReducer extends CombinedReducer {
    static connectHandlerUpdates = false;

    constructor(state) {
        super(state);
        this.makeHandler(this.state);
    }

    onHandlerUpdate(handler, path, action, prop, value) {
        //
    }

    makeHandler(state) {
        if (!state) {
            return this.handler;
        }
        if (this.handler && (this.handler.cached === state || this.handler.proxy === state) ) {
            return this.handler;
        }
        this.handler = new BulkImmutableHandler(state);
        if (this.constructor.connectHandlerUpdates) {
            this.handler.updates.push(this.onHandlerUpdate.bind(this));
        }

        return this.handler;
    }

    reduce(state, action) {
        let proxy = this.state = this.makeHandler(state).proxy;

        for (const reducer of this.reducers) {
            const reducedState = reducer.reduce(proxy, action);
            this.state = proxy = this.makeHandler(reducedState).proxy;
        }

        const newState = this.handler.freeze();

        return newState;
    }
}
