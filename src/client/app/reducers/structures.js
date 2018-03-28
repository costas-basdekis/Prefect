import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { lattice, toDict, dict, choice, range } from '../utils.js'

export const STRUCTURE_TYPES = toDict([
    'ENTRY',
    'EXIT',
    'ROAD',
    'HOUSE',
    'WELL',
    'PREFECTURE',
    'ENGINEERS_POST',
    'WHEAT_FARM',
    'GRANARY',
    'MARKET',
    'SMALL_TEMPLE',
], key => key);

const makeWorkData = (needed) => ({
    workers: {
        needed,
        allocated: 0,
        available: false,
        availableUntil: 0,
        availableLength: 120,
    },
});

const makeWandererData = () => ({
    id: null,
    createdOn: null,
    removeOn: null,
    nextOn: 0,
    life: 40,
    spawnWait: 10,
});

const workerSeekerGetText = ({data: {workers}}) =>
    workers.available
        ? `${workers.allocated}/${workers.needed}`
        : "!";

const needHasGetText = ({needs, has}) => Object.keys(needs)
    .map(key => `${key}: ${((has[key] || 0) * 100).toFixed(0)}/${(needs[key] * 100).toFixed(0)}`)
    .join(', ');

const needsNotHasGetText = ({needs, has}) => Object.keys(has)
    .filter(key => !(key in needs))
    .map(key => `${key}: ${((has[key] || 0) * 100).toFixed(0)}`)
    .join(', ');

const hasGetText = ({has}) => Object.keys(has)
    .map(key => `${key}: ${(has[key] * 100).toFixed(0)}`)
    .join(', ');

const UNITS_PER_CART = 100;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

const Carts = {
    perYear: (x)  => ({
        toDailyCarts: () => x / MONTHS_PER_YEAR / DAYS_PER_MONTH,
        toMonthlyCarts: () => x / MONTHS_PER_YEAR,
        toYearlyCarts: () => x,
    }),
};

const Units = {
    perYear: (x) => Carts.perYear(x / UNITS_PER_CART),
};

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
            reserves: {
                needsPerOccupant: {
                    // Two month's worth
                    WHEAT: Units.perYear(6).toMonthlyCarts() * 2,
                },
                needs: {},
                has: {},
                consumesPerOccupant: {
                    WHEAT: Units.perYear(6).toDailyCarts(),
                },
            },
            religiousAccess: {},
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
            ...makeWorkData(5),
            workerSeeker: makeWandererData(),
            prefect: makeWandererData(),
        }),
        getText: workerSeekerGetText,
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
            ...makeWorkData(5),
            workerSeeker: makeWandererData(),
            prefect: makeWandererData(),
        }),
        getText: workerSeekerGetText,
    },
    [STRUCTURE_TYPES.ENGINEERS_POST]: {
        size: {width: 1, height: 1},
        renderOptions: {
            stroke: "gold",
            fill: "blue",
        },
        textRenderOptions: {
            fill: "white",
        },
        makeData: tile => ({
            ...makeWorkData(5),
            workerSeeker: makeWandererData(),
            engineer: makeWandererData(),
        }),
        getText: workerSeekerGetText,
    },
    [STRUCTURE_TYPES.WHEAT_FARM]: {
        size: {width: 3, height: 3},
        renderOptions: {
            stroke: "brown",
            fill: "wheat",
        },
        makeData: tile => ({
            ...makeWorkData(10),
            workerSeeker: makeWandererData(),
            cartPusher: {
                id: null,
            },
            product: {
                status: 0,
                rate: Carts.perYear(19.2).toDailyCarts(),
                max: 2,
                type: 'WHEAT',
            },
        }),
        getText: tile => `
            ${workerSeekerGetText(tile)}
            [${(tile.data.product.status).toFixed(1)}/1]
        `,
    },
    [STRUCTURE_TYPES.GRANARY]: {
        size: {width: 3, height: 3},
        renderOptions: {
            stroke: "brown",
            fill: "brown",
        },
        textRenderOptions: {
            fill: "white",
        },
        makeData: tile => ({
            ...makeWorkData(10),
            workerSeeker: makeWandererData(),
            storage: {
                canAccept: {
                    'WHEAT': true,
                },
                accepts: {
                    'WHEAT': true,
                },
                has: {},
                capacity: 32,
            },
        }),
        getText: tile => `
            ${workerSeekerGetText(tile)}
            [${hasGetText(tile.data.storage)}]
        `,
    },
    [STRUCTURE_TYPES.MARKET]: {
        size: {width: 2, height: 2},
        renderOptions: {
            stroke: "brown",
            fill: "green",
        },
        textRenderOptions: {
            fill: "yellow",
        },
        makeData: tile => ({
            ...makeWorkData(5),
            workerSeeker: makeWandererData(),
            marketSeller: makeWandererData(),
            marketBuyer: {
                id: null,
            },
            reserves: {
                needs: {
                    'WHEAT': 8,
                },
                has: {},
            },
        }),
        getText: tile => `
            ${workerSeekerGetText(tile)}
            [${needHasGetText(tile.data.reserves)}]
            [${needsNotHasGetText(tile.data.reserves)}]
        `,
    },
    [STRUCTURE_TYPES.SMALL_TEMPLE]: {
        size: {width: 2, height: 2},
        renderOptions: {
            stroke: "gold",
            fill: "white",
        },
        textRenderOptions: {
            fill: "gold",
        },
        makeData: (tile, extraData) => ({
            ...makeWorkData(2),
            workerSeeker: makeWandererData(),
            priest: makeWandererData(),
            dedicatedTo: extraData.dedicatedTo,
        }),
        getText: tile => `
            ${workerSeekerGetText(tile)}
            ${tile.data.dedicatedTo}
        `,
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
        canUpgrade: ({data: {reserves: {has}}}) => has.WHEAT > 0,
    },
    {
        newData: {
            space: 10,
        },
        canUpgrade: ({data: {religiousAccess}}, state) =>
            Object.values(religiousAccess).filter(
                until => until >= state.date.ticks).length > 0,
    },
    {
        newData: {
            space: 13,
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

        this.regradeHouses(newState);
        this.updateWorks(newState);
        this.updateProduction(newState);
        this.updateLayers(newState);
        this.consumeFood(newState);
        this.updateHousesNeeds(newState);

        return newState;
    }

    static regradeHouses(state) {
        const oldStructures = state.structures
        for (let structure of Object.values(state.structures)) {
            if (structure.main) {
                continue;
            }
            if (structure.type !== STRUCTURE_TYPES.HOUSE) {
                continue;
            }
            const nonUpgradableLevels = HOUSE_STATS
                .map((houseStats, level) => [level + 1, houseStats.canUpgrade ?
                    houseStats.canUpgrade(structure, state) : false])
                .filter(([level, canUpgrade]) => !canUpgrade)
                .map(([level]) => level);
            const nextLevel = nonUpgradableLevels[0] || HOUSE_STATS.length;
            const targetLevel = nextLevel - 1;
            const currentLevel = structure.data.level;
            if (targetLevel === currentLevel) {
                continue;
            }
            let newLevel = targetLevel > currentLevel
                ? currentLevel + 1
                : currentLevel - 1;
            const newHouseStats = HOUSE_STATS[newLevel];
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
            }
            structure = state.structures[structure.key] = {
                ...structure,
                data: {
                    ...structure.data,
                    ...newHouseStats.newData,
                    level: newLevel,
                },
            };
        }

        return state;
    }

    static updateHousesNeeds(state) {
        const oldStructures = state.structures;
        for (let house of this.getStructuresOfType(state, STRUCTURE_TYPES.HOUSE)) {
            const occupants = house.data.occupants;
            const {needsPerOccupant, needs} = house.data.reserves;
            const newNeeds =
                Object.entries(needsPerOccupant)
                .map(([key, value]) => [key, value * occupants])
                .filter(([key, newNeed]) => newNeed != needs[key]);
            if (!newNeeds.length) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
            }
            house = state.structures[house.key] = {
                ...house,
                data: {
                    ...house.data,
                    reserves: {
                        ...house.data.reserves,
                        needs: {
                            ...house.data.reserves.needs,
                            ...dict(newNeeds),
                        },
                    },
                },
            };
        }

        return state;
    }

    static consumeFood(state) {
        const oldStructures = state.structures;
        for (let house of this.getStructuresOfType(state, STRUCTURE_TYPES.HOUSE)) {
            const occupants = house.data.occupants;
            if (!occupants) {
                continue;
            }
            let {consumesPerOccupant, has} = house.data.reserves;
            const willConsume = Object.entries(consumesPerOccupant)
                .map(([key, consumes]) =>
                    [key, Math.min(occupants * consumes, (has[key] || 0))])
                .filter(([key, consume]) => consume > 0);
            if (!willConsume.length) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
            }
            house = state.structures[house.key] = {
                ...house,
                data: {
                    ...house.data,
                    reserves: {
                        ...house.data.reserves,
                        has: {
                            ...has,
                            ...dict(willConsume
                                .map(([key, consume]) => [key, has[key] - consume])),
                        },
                    },
                },
            };
            ({consumesPerOccupant, has} = house.data.reserves);
        }

        return state;
    }

    static updateWorks(state) {
        const oldStructures = state.structures;
        for (const work of this.getStructuresWithDataAttribute(
                state, 'workers')) {
            if (work.data.workers.available && (work.data.workers.availableUntil < state.date.ticks)) {
                if (oldStructures === state.structures) {
                    state.structures = {...state.structures};
                }
                state.structures[work.key] = {
                    ...work,
                    data: {
                        ...work.data,
                        workers: {
                            ...work.data.workers,
                            available: false,
                        },
                    },
                };
            }
        }

        return state;
    }

    static updateProduction(state) {
        const oldStructures = state.structures;
        const works = this.getStructuresWithDataAttribute(state, 'product')
        for (let work of works) {
            const {workers: {allocated, needed}, product: {status, rate, max}} =
                work.data;
            if (status >= max) {
                continue;
            }
            if (!allocated) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
            }
            work = state.structures[work.key] = {
                ...work,
                data: {
                    ...work.data,
                    product: {
                        ...work.data.product,
                        status: Math.min(status + rate * allocated / needed, max),
                    },
                },
            };
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

    static setStructure(state, {data: {type, ...extraData}}, selectedTiles) {
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
            structureSize: structureType.size,
            randomValue: choice(range(64)),
        };
        structure.data = (structureType.makeData || (() => null))(
            structure, extraData);

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
