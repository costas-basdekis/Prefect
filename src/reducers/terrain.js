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
    actions = [
        actions.RESIZE_TERRAIN,
    ];

    initialiseState() {
        Object.assign(this.state, {
            properties: {
                width: 25,
                height: 25,
            },
            terrain: {},
        });
        this.resizeTerrain();
    }

    [actions.RESIZE_TERRAIN] (action) {
        const newWidth = parseInt(action.width, 10),
            newHeight = parseInt(action.height, 10);
        Object.assign(this.state.properties, {
            width: newWidth,
            height: newHeight,
        });
        this.resizeTerrain();
    }

    resizeTerrain() {
        const oldTerrain = this.state.terrain;
        const {width, height} = this.state.properties;
        this.state.terrain = {};
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const type = TILE_TYPES.GROUND; // choice(Object.keys(TILE_TYPES));
            this.state.terrain[key] = oldTerrain[key] || {
                type: type,
                subType: type === TILE_TYPES.GROUND
                    ? GROUND_TYPES.GRASS // choice(Object.keys(GROUND_TYPES))
                    : undefined,
                randomValue: choice(range(64)),
            }
        }
    }
}
