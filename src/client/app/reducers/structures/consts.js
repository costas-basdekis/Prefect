import { toDict } from '../../utils.js'

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
