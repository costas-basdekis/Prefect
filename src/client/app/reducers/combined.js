import * as actions from '../actions/actions.js'
import { TerrainReducer } from './terrain.js'
import { StructuresReducer } from './structures.js'
import { PeopleReducer } from './people.js'
import { TickReducer } from './tick.js'

class CombinedReducer {
    static reducers = [
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
        return {
            properties: {
                width: 25,
                height: 25,
            },
            terrain: {},
            structures: {},
            nextStructureId: 1,
            structuresKeysById: {},
            people: {},
            nextPersonId: 1,
            population: 0,
            date: {year: -50, month: 0, day: 1},
            money: 10000,
        };
    }

    static initialiseState(state) {
        for (const reducer of this.reducers) {
            state = reducer.initialiseState(state);
        }

        return state;
    }

    static reduce(state, action) {
        for (const reducer of this.reducers) {
            state = reducer.reduce(state, action);
        }

        return state;
    }
}

export const reducer = CombinedReducer.reduce.bind(CombinedReducer);
export const initialState = CombinedReducer.initialState.bind(CombinedReducer);
