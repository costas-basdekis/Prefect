import * as actions from '../actions/actions.js'

class Reducer {
    static actions = [
        actions.RESIZE_TERRAIN,
    ];

    static reduce(state, action) {
        if (Reducer.actions.indexOf(action.type) < 0) {
            return state;
        }

        return Reducer[action.type](state, action);
    }

    static initialState() {
        return {
            properties: {
                width: 0,
                height: 0,
            },
            terrain: {},
        };
    }

    static [actions.RESIZE_TERRAIN] (state, action) {
        const newWidth = action.width, newHeight = action.height;
        const newState = {
            ...state,
            properties: {
                ...state.properties,
                width: newWidth,
                height: newHeight,
            },
        };

        Reducer.resizeTerrain(newState, newWidth, newHeight);

        return newState;
    }

    static resizeTerrain(state, newWidth, newHeight) {
        const oldTerrain = state.terrain;
        state.terrain = {};
        for (const x of Array(newWidth).keys()) {
            for (const y of Array(newHeight).keys()) {
                const key = `${x}.${y}`;
                state.terrain[key] = oldTerrain[key] || null;
            }
        }
    }
}

export const reducer = Reducer.reduce;
export const initialState = Reducer.initialState;
