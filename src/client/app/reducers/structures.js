import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { lattice, toDict } from '../utils.js'

export const STRUCTURE_TYPES = toDict([
    'ENTRY',
    'EXIT',
    'ROAD',
    'HOUSE',
    'WELL',
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
        makeData: tile => ({
            level: 0,
            space: 1,
            occupants: 0,
            newcomers: [],
            water: 0,
        }),
        getText: ({data: {level, occupants}}) => `${level}/${occupants}`,
    },
    [STRUCTURE_TYPES.WELL]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "cyan",
            fill: "cyan",
        },
    },
};

export const HOUSE_STATS = [
    {
        canUpgrade: ({data}) => data.occupants > 0,
    },
    {
        newData: {
            space: 3,
        },
        canUpgrade: ({data}) => data.water > 0,
    },
    {
        newData: {
            space: 7,
        },
    },
];

export class StructuresReducer extends Reducer {
    static actions = [
        actions.RESIZE_TERRAIN,
        actions.SELECTION_END,
        actions.TICK,
    ];

    static [ actions.TICK] (state, action) {
        return this.upgradeHouses({...state});
    }

    static upgradeHouses(state) {
        for (let structure of Object.values(state.structures)) {
            if (structure.main) {
                continue;
            }
            if (structure.type !== STRUCTURE_TYPES.HOUSE) {
                continue;
            }
            const houseStats = HOUSE_STATS[structure.data.level];
            if (!houseStats.canUpgrade) {
                continue;
            }
            if (!houseStats.canUpgrade(structure)) {
                continue;
            }
            const nextHouseStats = HOUSE_STATS[structure.data.level + 1];
            structure = state.structures[structure.key] = {
                ...structure,
                data: {
                    ...structure.data,
                    ...nextHouseStats.newData,
                    level: structure.data.level + 1,
                },
            };
        }

        return state;
    }

    static [actions.RESIZE_TERRAIN] (state, action) {
        return this.resizeStructures({...state});
    }

    static resizeStructures(state) {
        const oldStructures = state.structures;
        const {width, height} = state.properties;
        state.structures = {};
        state.population = 0;
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
            state.population += oldStructure.occupants;
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

        if (tool.toolType === 'SINGLE_STRUCTURE') {
            return this.setStructure({...state}, tool, selectedTiles);
        } else if (tool.toolType === 'RANGE_OF_STRUCTURES') {
            return this.setStructures({...state}, tool, selectedTiles);
        } else if (tool.toolType === 'CLEAR') {
            return this.clearSpace({...state}, selectedTiles);
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
            if (structure.type === STRUCTURE_TYPES.HOUSE) {
                state.population -= structure.data.occupants;
            }
            delete state.structuresKeysById[structure.id];
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
        if (structureType.unique && this.structureTypeExists(state, type)) {
            return state;
        }
        const tile = selectedTiles[0];
        const id = state.nextStructureId;
        state.nextStructureId += 1;

        const structure = {
            id,
            type,
            start: {x: tile.x, y: tile.y},
            end: {
                x: tile.x + structureType.size.width - 1,
                y: tile.y + structureType.size.height - 1,
            },
            key: `${tile.x}.${tile.y}`,
            renderOptions: structureType.renderOptions,
            getText: structureType.getText,
        };
        structure.data = (structureType.makeData || (() => null))(structure);

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
                state.structures[key] = {main: structure.key, key};
            }
        }

        state.structuresKeysById[structure.id] = structure.key;

        return state;
    }

    static structureTypeExists(state, structureType) {
        for (const structure of Object.values(state.structures)) {
            if (structure.type === structureType) {
                return true;
            }
        }

        return false;
    }
}
