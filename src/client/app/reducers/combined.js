import * as actions from '../actions/actions.js'
import { StateReducer } from './state.js'
import { TerrainReducer } from './terrain.js'
import { StructuresReducer } from './structures.js'
import { PeopleReducer } from './people.js'
import { TickReducer } from './tick.js'
import { BulkImmutableHandler } from '../BulkImmutable.js'

class CombinedReducer {
    static reducers = [
        StateReducer,
        TerrainReducer,
        StructuresReducer,
        PeopleReducer,
        TickReducer,
    ];

    static initialState() {
        const state = this.createInitialState();
        return this.initialiseState(state);
    }

    static createInitialState() {
        return StateReducer.createInitialState();
    }

    static initialiseState(state) {
        for (const reducer of this.reducers) {
            state = reducer.initialiseState(state);
        }

        return state;
    }

    static handler = null;

    static onHandlerUpdate(handler, path, action, prop, value) {
        if (['animationFraction', 'x', 'y'].indexOf(prop) >= 0) {
            return;
        }
        console.log(path, action, prop, value);
    }

    static makeHandler(state) {
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

    static reduce(state, action) {
        let proxy = this.makeHandler(state).proxy;

        for (const reducer of this.reducers) {
            const reducedState = reducer.reduce(proxy, action);
            proxy = this.makeHandler(reducedState).proxy;
        }

        const newState = this.handler.freeze();

        return newState;
    }
}

export const reducer = CombinedReducer.reduce.bind(CombinedReducer);
export const initialState = CombinedReducer.initialState.bind(CombinedReducer);
