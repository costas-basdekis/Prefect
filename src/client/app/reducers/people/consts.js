import { toDict } from '../../utils.js'

export const PEOPLE_TYPES = toDict([
    'NEWCOMER',
    'HOMELESS',
    'WORKER_SEEKER',
    'PREFECT',
    'ENGINEER',
    'CART_PUSHER',
    'MARKET_SELLER',
    'MARKET_BUYER',
    'PRIEST',
], key => key);

export const PEOPLE = {
    [PEOPLE_TYPES.NEWCOMER]: {
        renderOptions: {
            stroke: "yellow",
            fill: "orange",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.HOMELESS]: {
        renderOptions: {
            stroke: "red",
            fill: "orange",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.WORKER_SEEKER]: {
        renderOptions: {
            stroke: "yellow",
            fill: "grey",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.PREFECT]: {
        renderOptions: {
            stroke: "gold",
            fill: "red",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.ENGINEER]: {
        renderOptions: {
            stroke: "gold",
            fill: "blue",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.CART_PUSHER]: {
        renderOptions: {
            stroke: "brown",
            fill: "brown",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.MARKET_SELLER]: {
        renderOptions: {
            stroke: "brown",
            fill: "green",
        },
        textRenderOptions: {
            fill: "yellow",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.MARKET_BUYER]: {
        renderOptions: {
            stroke: "brown",
            fill: "green",
        },
        textRenderOptions: {
            fill: "red",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.PRIEST]: {
        renderOptions: {
            stroke: "gold",
            fill: "white",
        },
        textRenderOptions: {
            fill: "gold",
        },
        speed: 1,
        accessDuration: 30,
    },
};
