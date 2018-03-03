import React from 'react';
import { connect4, lattice } from '../utils.js'
import { TILE_TYPES, GROUND_TYPES } from '../reducers/prefect.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCTerrain extends BaseGrid {
    static createTile(state, ownProps, {x, y, key}) {
        return state.terrain[`${x}.${y}`]
    }

    TILE_TYPE_OPTIONS = {
        [TILE_TYPES.GROUND]: {
            [GROUND_TYPES.GRASS]: {
                stroke: "green",
                fill: "lightgreen",
            },
            [GROUND_TYPES.DESERT]: {
                stroke: "yellow",
                fill: "lightyellow",
            },
            [GROUND_TYPES.TREES]: {
                stroke: "green",
                fill: "darkgreen",
            },
        },
        [TILE_TYPES.WATER]: {
            undefined: {
                stroke: "blue",
                fill: "royalblue",
            },
        },
        [TILE_TYPES.ROCK]: {
            undefined: {
                stroke: "grey",
                fill: "#666",
            },
        },
    }

    getTileOptions(tile) {
        const tileOptions = this.TILE_TYPE_OPTIONS[tile.tile.type] || {};
        const tileSubOptions = tileOptions[tile.tile.subType] || {};
        return tileSubOptions;
    }
}

export const Terrain = connect4(UCTerrain);
