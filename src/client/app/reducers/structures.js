import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { lattice, toDict } from '../utils.js'

export const STRUCTURE_TYPES = toDict([
    'ENTRY',
    'EXIT',
    'ROAD',
    'HOUSE',
    'WELL',
    'PREFECTURE',
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
        makeData: tile => ({
            level: 1,
            waterSupplyLevelNeeded: 0,
            range: 2,
        }),
    },
    [STRUCTURE_TYPES.PREFECTURE]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "gold",
            fill: "red",
        },
        textRenderOptions: {
            fill: "white",
        },
        makeData: tile => ({
            workersNeeded: 5,
            workersAllocated: 0,
            workersAvailable: false,
            workersAvailableUntil: 0,
            workersAvailableLength: 120,
            workerSeeker: {
                id: null,
                createdOn: null,
                removeOn: null,
                nextOn: 0,
                life: 40,
                spawnWait: 10,
            },
            prefect: {
                id: null,
                createdOn: null,
                removeOn: null,
                nextOn: 0,
                life: 40,
                spawnWait: 10,
            },
        }),
        getText: ({data}) => data.workersAvailable ?
            `${data.workersAllocated}/${data.workersNeeded}`
            : "!",
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
        const newState = {...state};

        this.upgradeHouses(newState);
        this.updateWorks(newState);
        this.updateLayers(newState);

        return newState;
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

    static updateWorks(state) {
        const oldStructures = state.structures;
        for (const work of this.getStructuresWithDataAttribute(
                state, 'workersAvailableUntil')) {
            if (work.data.workersAvailableUntil < state.date.ticks) {
                if (oldStructures === state.structures) {
                    state.structures = {...state.structures};
                }
                state.structures[work.key] = {
                    ...work,
                    data: {
                        ...work.data,
                        workersAvailable: false,
                    },
                };
            } else if (work.data.workersAvailable && !work.data.workersAllocated) {
                if (oldStructures === state.structures) {
                    state.structures = {...state.structures};
                }
                state.structures[work.key] = {
                    ...work,
                    data: {
                        ...work.data,
                        workersAllocated: work.data.workersNeeded,
                    },
                };
            }
        }

        return state;
    }

    static updateLayers(state, reset=false) {
        this.updateWater(state, reset);

        return state;
    }

    static updateWater(state, reset=false) {
        const waterStructures = this.getStructuresOfType(
            state, STRUCTURE_TYPES.WELL);
        state.layers = {
            ...state.layers,
            water: {},
        };
        const waterLayer = state.layers.water;
        for (const structure of waterStructures) {
            const {x: centerX, y: centerY} = structure.start;
            const {range, level} = structure.data;
            const start = {
                x: Math.max(0, centerX - range),
                y: Math.max(0, centerY - range),
            };
            const end = {
                x: Math.min(centerX + range + 1, state.properties.width) ,
                y: Math.min(centerY + range + 1, state.properties.height),
            };
            for (const [x, y] of lattice([start.x, end.x], [start.y, end.y])) {
                const key = `${x}.${y}`;
                if (!waterLayer[key] || waterLayer[key] < level) {
                    waterLayer[key] = level;
                }
            }
        }

        const houses = Object.values(state.structures)
            .filter(structure => structure.type === STRUCTURE_TYPES.HOUSE);
        let oldStructures = state.structures;
        for (let house of houses) {
            let waterLevel = 0;
            for (const [x, y] of lattice([house.start.x, house.end.x + 1],
                                         [house.start.y, house.end.y + 1])) {
                const key = `${x}.${y}`;
                waterLevel = Math.max(waterLevel, waterLayer[key] || 0);
            }
            if (house.data.water !== waterLevel) {
                if (oldStructures === state.structures) {
                    state.structures = {...state.structures};
                }
                state.structures[house.key] = house = {
                    ...house, data: {
                        ...house.data,
                        water: waterLevel,
                    },
                };
            }
        }
    }

    static getStructuresOfType(state, type) {
        return Object.values(state.structures)
            .filter(structure => structure.type === type);
    }

    static getStructuresWithDataAttribute(state, attribute) {
        return Object.values(state.structures)
            .filter(structure => structure.data && attribute in structure.data);
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

    static resizeLayers(state) {
        const mapLattice = lattice(width, height);
        state.layers = {...state.layers};
        for (const layerName in state.layers) {
            state.layers[layerName] = toDict(mapLattice, key => null);
        }

        this.updateLayers(state, true);

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
        const oldStructures = state.structures;
        for (const {key} of selectedTiles) {
            let structure = state.structures[key];
            if (!structure) {
                continue;
            }
            if (structure.main) {
                structure = state.structures[structure.main];
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
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
            textRenderOptions: structureType.textRenderOptions,
            getText: structureType.getText,
        };
        structure.data = (structureType.makeData || (() => null))(structure);

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (state.structures[key]) {
                return state;
            }
        }

        state.structures = {...state.structures};
        state.structuresKeysById = {...state.structuresKeysById};

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
