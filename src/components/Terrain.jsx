import { connect4 } from '../utils.js'
import { TILE_TYPES, GROUND_TYPES } from '../reducers/terrain.js'
import { BaseGrid, TILE_TRANSFORM } from './BaseGrid.jsx'

class UCTerrain extends BaseGrid {
    static selectors = {
        ...BaseGrid.selectors,
        terrain: (state, ownProps) => state.terrain,
    };

    static createTile({terrain}, {x, y, key}) {
        return terrain[`${x}.${y}`]
    }

    static TEXTURES_DEFINITIONS = [
        sg2Manager => sg2Manager.loadRange({
            filename: "Land1a.bmp",
            start: 61,
            count: 58,
            key: [`${TILE_TYPES.GROUND}.${GROUND_TYPES.GRASS}`],
        }, () =>  ({transform: TILE_TRANSFORM})),
    ];

    TILE_TYPE_OPTIONS = {
        [TILE_TYPES.GROUND]: {
            [GROUND_TYPES.GRASS]: {
                stroke: "green",
                fill: "lightgreen",
                useImageTemplate: `${TILE_TYPES.GROUND}.${GROUND_TYPES.GRASS}`,
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
        const tileSubOptions = Object.assign({}, tileOptions[tile.tile.subType] || {});
        return tileSubOptions;
    }
}

export const Terrain = connect4(UCTerrain);
