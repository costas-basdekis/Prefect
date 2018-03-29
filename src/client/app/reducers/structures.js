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
    actions = [
        actions.RESIZE_TERRAIN,
        actions.SELECTION_END,
        actions.TICK,
    ];

    initialiseState() {
        Object.assign(this.state, {
            structures: {},
            layers: {
                water: {},
            },
            nextStructureId: 1,
            structuresKeysById: {},
        });
    }

    [actions.TICK] (action) {
        this.regradeHouses();
        this.updateWorks();
        this.updateProduction();
        this.updateLayers();
        this.consumeFood();
        this.updateHousesNeeds();
    }

    regradeHouses() {
        for (const structure of this.structuresList) {
            if (structure.main) {
                continue;
            }
            if (structure.type !== STRUCTURE_TYPES.HOUSE) {
                continue;
            }
            const nonUpgradableLevels = HOUSE_STATS
                .map((houseStats, level) => [level + 1, houseStats.canUpgrade ?
                    houseStats.canUpgrade(structure, this.state) : false])
                .filter(([level, canUpgrade]) => !canUpgrade)
                .map(([level]) => level);
            const nextLevel = nonUpgradableLevels[0] || HOUSE_STATS.length;
            const targetLevel = nextLevel - 1;
            const currentLevel = structure.data.level;
            if (targetLevel === currentLevel) {
                continue;
            }
            const newLevel = targetLevel > currentLevel
                ? currentLevel + 1
                : currentLevel - 1;
            const newHouseStats = HOUSE_STATS[newLevel];
            structure.data.level = newLevel;
            Object.assign(structure.data, newHouseStats.newData);
        }
    }

    updateHousesNeeds() {
        for (const house of this.getStructuresOfType(STRUCTURE_TYPES.HOUSE)) {
            const occupants = house.data.occupants;
            const {needsPerOccupant, needs} = house.data.reserves;
            const newNeeds =
                Object.entries(needsPerOccupant)
                .map(([key, value]) => [key, value * occupants])
                .filter(([key, newNeed]) => newNeed != needs[key]);
            if (!newNeeds.length) {
                continue;
            }
            Object.assign(house.data.reserves.needs, dict(newNeeds));
        }
    }

    consumeFood() {
        for (const house of this.getStructuresOfType(STRUCTURE_TYPES.HOUSE)) {
            const occupants = house.data.occupants;
            if (!occupants) {
                continue;
            }
            const {consumesPerOccupant, has} = house.data.reserves;
            const willConsume = Object.entries(consumesPerOccupant)
                .map(([key, consumes]) =>
                    [key, Math.min(occupants * consumes, (has[key] || 0))])
                .filter(([key, consume]) => consume > 0);
            if (!willConsume.length) {
                continue;
            }
            Object.assign(house.data.reserves.has, dict(willConsume
                .map(([key, consume]) => [key, has[key] - consume])))
        }
    }

    updateWorks() {
        for (const work of this.getStructuresWithDataProperty('workers')) {
            if (work.data.workers.available
                && (work.data.workers.availableUntil < this.ticks)) {
                work.dta.workers.available = false;
            }
        }
    }

    updateProduction() {
        const works = this.getStructuresWithDataProperty('product')
        for (const work of works) {
            const {workers: {allocated, needed}, product: {status, rate, max}} =
                work.data;
            if (status >= max) {
                continue;
            }
            if (!allocated) {
                continue;
            }
            work.data.product.status =
                Math.min(status + rate * allocated / needed, max);
        }
    }

    updateLayers(reset=false) {
        this.updateWater(reset);
    }

    updateWater(reset=false) {
        const waterStructures = this.getStructuresOfType(STRUCTURE_TYPES.WELL);
        this.state.layers.water = {};
        const waterLayer = this.state.layers.water;
        for (const structure of waterStructures) {
            const {x: centerX, y: centerY} = structure.start;
            const {range, level} = structure.data;
            const start = {
                x: Math.max(0, centerX - range),
                y: Math.max(0, centerY - range),
            };
            const end = {
                x: Math.min(centerX + range + 1, this.state.properties.width) ,
                y: Math.min(centerY + range + 1, this.state.properties.height),
            };
            for (const [x, y] of lattice([start.x, end.x], [start.y, end.y])) {
                const key = `${x}.${y}`;
                if (!waterLayer[key] || waterLayer[key] < level) {
                    waterLayer[key] = level;
                }
            }
        }

        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        for (const house of houses) {
            let waterLevel = 0;
            for (const [x, y] of lattice([house.start.x, house.end.x + 1],
                                         [house.start.y, house.end.y + 1])) {
                const key = `${x}.${y}`;
                waterLevel = Math.max(waterLevel, waterLayer[key] || 0);
            }
            house.data.water = waterLevel;
        }
    }

    [actions.RESIZE_TERRAIN] (action) {
        this.resizeStructures();
    }

    resizeStructures() {
        const {width, height} = this.state.properties;
        this.state.structures = {};
        this.state.population = 0;
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
            this.structures[key] = oldStructure;
            this.state.population += oldStructure.occupants;
        }
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const structure = this.structures[key];
            if (!structure || !structure.main) {
                continue;
            }
            for (const [eX, eY] of this.getStructureTiles(structure)) {
                if (eX === x && eY === y) {
                    continue;
                }
                this.structures[`${eX}.${eY}`] = {main: key};
            }
        }
    }

    resizeLayers() {
        const mapLattice = lattice(width, height);
        for (const layerName in this.state.layers) {
            this.state.layers[layerName] = toDict(mapLattice, key => null);
        }

        this.updateLayers(true);
    }

    getStructureTiles(structure) {
        return lattice(
            [structure.start.x, structure.end.x + 1],
            [structure.start.y, structure.end.y + 1]);
    }

    [actions.SELECTION_END] (action) {
        const {tool, selectedTiles} = action;

        if (tool.toolType === 'SINGLE_STRUCTURE') {
            return this.setStructure(tool, selectedTiles);
        } else if (tool.toolType === 'RANGE_OF_STRUCTURES') {
            return this.setStructures(tool, selectedTiles);
        } else if (tool.toolType === 'CLEAR') {
            return this.clearSpace(selectedTiles);
        }
    }

    clearSpace(selectedTiles) {
        this.clearStructures(selectedTiles);
    }

    clearStructures(selectedTiles) {
        for (const {key} of selectedTiles) {
            let structure = this.structures[key];
            if (!structure) {
                continue;
            }
            if (structure.main) {
                structure = this.structures[structure.main];
            }
            for (const [x, y] of this.getStructureTiles(structure)) {
                delete this.structures[`${x}.${y}`];
            }
            if (structure.type === STRUCTURE_TYPES.HOUSE) {
                this.state.population -= structure.data.occupants;
            }
            delete this.state.structuresKeysById[structure.id];
        }
    }

    setStructures(tile, selectedTiles) {
        for (const selectedTile of selectedTiles) {
            this.setStructure(tile, [selectedTile]);
        }
    }

    setStructure({data: {type, ...extraData}}, selectedTiles) {
        const structureType = STRUCTURES[type];
        if (!structureType) {
            console.error("Unknown structure type: ", type);
            return;
        }
        if (structureType.unique && this.structureTypeExists(type)) {
            return;
        }
        const tile = selectedTiles[0];
        const id = this.state.nextStructureId;
        this.state.nextStructureId += 1;

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
            if (this.structures[key]) {
                return;
            }
        }

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (eX === tile.x && eY === tile.y) {
                this.structures[key] = structure;
            } else {
                this.structures[key] = {main: structure.key, key};
            }
        }

        this.state.structuresKeysById[structure.id] = structure.key;
    }
}
