import * as actions from '../actions/actions.js'
import { lattice, choice, toDict } from '../utils.js'

export const GROUND_TYPES = toDict([
    'GRASS',
    'DESERT',
    'TREES',
], key => key);

export const TILE_TYPES = toDict([
    'GROUND',
    'WATER',
    'ROCK',
], key => key);

class Reducer {
    static actions = [
        actions.RESIZE_TERRAIN,
    ];

    static reduce(state, action) {
        if (this.actions.indexOf(action.type) < 0) {
            return state;
        }

        return this[action.type](state, action);
    }

    static initialState() {
        return this.resizeTerrain({
            properties: {
                width: 25,
                height: 25,
            },
            terrain: {},
            roads: {},
        });
    }

    static [actions.RESIZE_TERRAIN] (state, action) {
        const newWidth = parseInt(action.width),
            newHeight = parseInt(action.height);
        const newState = this.resize({
            ...state,
            properties: {
                ...state.properties,
                width: newWidth,
                height: newHeight,
            },
        });

        return newState;
    }

    static resize(state) {
        this.resizeTerrain(state);
        this.resizeRoads(state);

        return state;
    }

    static resizeTerrain(state) {
        const oldTerrain = state.terrain;
        const {width, height} = state.properties;
        state.terrain = {};
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const type = TILE_TYPES.GROUND; // choice(Object.keys(TILE_TYPES));
            state.terrain[key] = oldTerrain[key] || {
                type: type,
                subType: type === TILE_TYPES.GROUND
                    ? GROUND_TYPES.GRASS // choice(Object.keys(GROUND_TYPES))
                    : undefined,
            }
        }

        return state;
    }

    static resizeRoads(state) {
        const oldRoads = state.roads;
        const {width, height} = state.properties;
        state.roads = {};
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            if (!oldRoads[key]) {
                continue;
            }
            state.roads[key] = oldRoads[key];
        }

        return state;
    }
}

export const reducer = Reducer.reduce.bind(Reducer);
export const initialState = Reducer.initialState.bind(Reducer);
