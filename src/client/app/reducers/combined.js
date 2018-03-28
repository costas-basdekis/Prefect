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

    static reduce(state, action) {
        if (!this.handler || this.handler.cached !== state) {
            this.handler = new BulkImmutableHandler(state);
        }
        let proxy = this.handler.proxy;

        for (const reducer of this.reducers) {
            const reducedState = reducer.reduce(proxy, action);
            if (reducedState
                && this.handler.cached !== reducedState
                && this.handler.proxy !== reducedState) {
                this.handler = new BulkImmutableHandler(reducedState);
                proxy = this.handler.proxy;
            }
        }

        const newState = this.handler.freeze();

        return newState;
    }
}

export const reducer = CombinedReducer.reduce.bind(CombinedReducer);
export const initialState = CombinedReducer.initialState.bind(CombinedReducer);
