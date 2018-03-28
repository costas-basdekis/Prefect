import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { lattice, choice, range, toDict } from '../utils.js'

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

export class TerrainReducer extends Reducer {
    static actions = [
        actions.RESIZE_TERRAIN,
    ];

    static initialiseState(state) {
        return this.resizeTerrain(state);
    }

    static [actions.RESIZE_TERRAIN] (state, action) {
        const newWidth = parseInt(action.width),
            newHeight = parseInt(action.height);
        Object.assign(state.properties, {
            width: newWidth,
            height: newHeight,
        });
        this.resizeTerrain(state);
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
                randomValue: choice(range(64)),
            }
        }

        return state;
    }
}
