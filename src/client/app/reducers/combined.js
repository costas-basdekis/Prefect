import * as actions from '../actions/actions.js'
import { StateReducer } from './state.js'
import { TerrainReducer } from './terrain.js'
import { StructuresReducer } from './structures.js'
import { PeopleReducer } from './people.js'
import { TickReducer } from './tick.js'
import { BulkImmutableHandler } from '../BulkImmutable.js'

class CombinedReducer {
    reducersClasses = [
        StateReducer,
        TerrainReducer,
        StructuresReducer,
        PeopleReducer,
        TickReducer,
    ];

    constructor() {
        this.state = StateReducer.createInitialState();
        this.reducers = this.reducersClasses.map(_class => new _class(this.state));
        return this.initialiseState();
    }

    createInitialState() {
        return StateReducer.createInitialState();
    }

    initialiseState() {
        for (const reducer of this.reducers) {
            reducer.initialiseState();
        }
    }

    handler = null;

    onHandlerUpdate(handler, path, action, prop, value) {
        if (['animationFraction', 'x', 'y'].indexOf(prop) >= 0) {
            return;
        }
        console.log(path, action, prop, value);
    }

    makeHandler(state) {
        if (!state) {
            return this.handler;
        }
        if (this.handler && (this.handler.cached === state || this.handler.proxy === state) ) {
            return this.handler;
        }
        this.handler = new BulkImmutableHandler(state);
        // this.handler.updates.push(this.onHandlerUpdate.bind(this));

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

export const reducerInstance = new CombinedReducer();
export const reducer = reducerInstance.reduce.bind(reducerInstance);
export const initialState = () => reducerInstance.state;
