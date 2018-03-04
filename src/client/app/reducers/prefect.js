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

export const STRUCTURE_TYPES = toDict([
    'ENTRY',
    'EXIT',
    'ROAD',
    'HOUSE',
], key => key);

export const STRUCTURES = {
    [STRUCTURE_TYPES.ENTRY]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "black",
            fill: "red",
        },
        unique: true,
    },
    [STRUCTURE_TYPES.EXIT]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "black",
            fill: "blue",
        },
        unique: true,
    },
    [STRUCTURE_TYPES.ROAD]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "beige",
            fill: "white",
        },
    },
    [STRUCTURE_TYPES.HOUSE]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "salmon",
            fill: "orange",
        },
        unique: false,
    },
};

class Reducer {
    static actions = [
        actions.RESIZE_TERRAIN,
        actions.SELECTION_END,
        actions.TICK,
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
            structures: {},
            population: 0,
            date: {year: -50, month: 0, day: 1},
            money: 10000,
        });
    }

    static [actions.TICK] (state, action) {
        return this.tick({...state});
    }

    static tick(state) {
        this.tickDate(state);

        return state;
    }

    static tickDate(state) {
        state.date = {...state.date, day: state.date.day + 1};
        if (state.date.day >= 31) {
            state.date.day = 1;
            state.date.month += 1;
            if (state.date.month >= 12) {
                state.date.month = 0;
                state.date.year += 1;
            }
        }

        return state;
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
        this.resizeStructures(state);

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

    static resizeStructures(state) {
        const oldStructures = state.structures;
        const {width, height} = state.properties;
        state.structures = {};
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const oldStructure = oldStructures[key];
            if (!oldStructure || oldStructure.main) {
                continue;
            }
            const {x: endX, y: endY} = oldStructure.end;
            if (endX >= width || endY >= height) {
                continue;
            }
            state.structures[key] = oldStructure;
        }
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const structure = state.structures[key];
            if (!structure || !structure.main) {
                continue;
            }
            for (const [eX, eY] of this.getStructureTiles(structure)) {
                if (eX === x && eY === y) {
                    continue;
                }
                state.structures[`${eX}.${eY}`] = {main: key};
            }
        }

        return state;
    }

    static getStructureTiles(structure) {
        return lattice(
            [structure.start.x, structure.end.x + 1],
            [structure.start.y, structure.end.y + 1]);
    }

    static [actions.SELECTION_END] (state, action) {
        const {tool, selectedTiles} = action;

        if (tool.key === 'ROAD') {
            return this.setStructures({...state}, tool, selectedTiles);
        } else if (tool.key === 'CLEAR') {
            return this.clearSpace({...state}, selectedTiles);
        } else if (tool.key === 'ENTRY') {
            return this.setStructure({...state}, tool, selectedTiles);
        } else if (tool.key === 'EXIT') {
            return this.setStructure({...state}, tool, selectedTiles);
        } else if (tool.key === 'HOUSE') {
            return this.setStructures({...state}, tool, selectedTiles);
        }

        return state;
    }

    static clearSpace(state, selectedTiles) {
        this.clearStructures(state, selectedTiles);

        return state;
    }

    static clearStructures(state, selectedTiles) {
        for (const {key} of selectedTiles) {
            let structure = state.structures[key];
            if (!structure) {
                continue;
            }
            if (structure.main) {
                structure = state.structures[structure.main];
            }
            for (const [x, y] of this.getStructureTiles(structure)) {
                delete state.structures[`${x}.${y}`];
            }
        }

        return state;
    }

    static setStructures(state, tile, selectedTiles) {
        for (const selectedTile of selectedTiles) {
            this.setStructure(state, tile, [selectedTile]);
        }

        return state;
    }

    static setStructure(state, {data: {type}}, selectedTiles) {
        const structureType = STRUCTURES[type];
        if (!structureType) {
            console.error("Unknown structure type: ", type);
            return state
        }
        const tile = selectedTiles[0];

        const structure = {
            type,
            start: {x: tile.x, y: tile.y},
            end: {
                x: tile.x + structureType.size.width - 1,
                y: tile.y + structureType.size.height - 1,
            },
            key: `${tile.x}.${tile.y}`,
            renderOptions: structureType.renderOptions,
        };

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (state.structures[key]) {
                return state;
            }
        }

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (eX === tile.x && eY === tile.y) {
                state.structures[key] = structure;
            } else {
                state.structures[key] = {main: structure[key], key};
            }
        }

        return state;
    }
}

export const reducer = Reducer.reduce.bind(Reducer);
export const initialState = Reducer.initialState.bind(Reducer);
