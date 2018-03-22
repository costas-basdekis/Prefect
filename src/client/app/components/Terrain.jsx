import React from 'react';
import { createSelector } from 'reselect';
import { connect4, lattice } from '../utils.js'
import { TILE_TYPES, GROUND_TYPES } from '../reducers/terrain.js'
import { BaseGrid } from './BaseGrid.jsx'

const TILE_TRANSFORM = `
    translate(10 10)
    scale(0.78 0.64)
    translate(-29 5)
    skewY(-35)
    rotate(62 29 15)
`;

class UCTerrain extends BaseGrid {
    static selectors = {
        ...BaseGrid.selectors,
        terrain: (state, ownProps) => state.terrain,
    };

    static createTile({terrain}, {x, y, key}) {
        return terrain[`${x}.${y}`]
    }

    USE_IMAGES = {
        [`${TILE_TYPES.GROUND}.${GROUND_TYPES.GRASS}`]: {
            href: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAAeCAYAAAB9hg0IAAAFgklEQVRYR71ZIWwjRxR9YWM2y7xwoVlTlsKw0sKyqqiqVKk6VJ104HRHTqqKqqJTWWCO9VgPpqgpqsv22JrtMg/z6f3ZNx6PnTqJY68i+TbxzP/v//f/fzN3hhM/X33jV7OmxusX87NTmj6ZsWc/NauwAOAAXzvDGPqAn39pT+LD0Y08fzlbhWVAu+hTAitXYVo7LLpA3OhCj+vfh6P6crTNCXDogoHQU4cK/nwaX8OQsspM1zOHpa/x+oc/j+LTk2/6/XfNKiKwH/gpMHyMn65yCM7DhQHzeWc0Zr3CewAThK41/MfI8JMB/ZYAA+Ac4DzgJrEO8ycHOZvV8YuEGAb83XYItw6hCZhNKwtCP/QI8y9w/dcfB/t58AYEyHrTw3okyMWc+YyZ5MNspu/0Ib47byBfvWhx+ZmHOw+oXTUuANoPS4RmwNQ7YHGJq/fXj/b30QtZg+qcOYh525mjVajQuz5Sk0weKZvA8t067yI1qmZaoZp4dN2wWduuUvLR/XOBq/dXD/b7wQue/dis8lrjiKDH7Ko1Krgxg0bjsSYFjrW5QeWiG3/eNOiXg/qUgVWGyfJq4tAvg322t+d4++7+gO8N9NmbixUdZWaMimGw8dDnXVWRH0Eqkwlct0gU5lpS018EMJNlTbME8rjQbHp3QMf6vXWom8t7Ad4LlAAFLKcqM9kO69HBv9FhPuyy09l2MxJg0ZvZKhsX9yUTOJoSE3KQ6Zc0BGMQM/zvzex/a/hOoKpBgSsbCt/pMJ31tUdYDnATfW6ClPMbvM1emF32G6N6BnQkT6pbLtFcVpAIssuC0n/cXcNbQMsalBOop0ZXpiBvIAIagbeW1WGAUZoKiFGHhykhBW0IMGD8FPX5XYG172XUJWD2AFKVnZmPald1LGZMAKvjsmkloBTbja9QzRz6IQ71PNJ5NqR41iDXNKODlv2JM2dVe/o3WcCOLAGxK8u5ZKSNXF3lIHNqy54FKeYjio//znH94frsjBSVcdZV3mxII0aduVDECLK9WaaZJ3rJaN5A5CCzLMUz3DhcfF1t2MkzLe27C1C5n8DwkKAAy06efdo/I1W5KRuLxHZyuuh8NMQN+My+nGzVpER6imY2HlRfuQ3r2rTrK1OB+4LEPRS0uo7zVvvmVNb3lGVq6UTdXQJAdZIDZI3EcRDHzDAaM7rGX8VaHEdmOQvN+Cge1Hj0bp2WzLej3HozNrpiBCc72l9HvzxJtKVz71YzyjWroqXFjBojuYxQUsPIOyEdJPiyrqSQuDI1uEwaEuR8x1wt61W+bJ2KxnHGvdn4yoP9neOFpxBuJrVCA5RnBKksKppl58tnoDKdmtJY9xv6uJideXbUJ6ZjhpldnW1jM1yPMoJ8+9vug/xewcBuLM7nQHdScqzpXXRiZjh2CNAaR4jjRYATbU0Xx7xx3FigOF+tg3sbYXo4JTT29l3N7AWqTV+9PF9Rh0rT5lcijKQezkWr4aoZizWKfKv3RVQydroZKaZ1UkvGnPEGIm0a4ZooUTZVCvsAao97A9UCUTqvOdWdZUcdibp4nKkGdAF02JSMJhLGs6uAlvsqSASYz9/7Anw0UC3kZdeGEM8A8jt0PNw4uFG0a77xhGODOV5CpLujmLN4cSZxUV7FHHJ7+OCMbtIJ4ByWpFMtzd8tDaC6tI5eEhq7TisbereY37T56x1NpvTnrveDgWpjNq10O7BDfJedUs2J69WQVOtSR9zvUIAHU/euyD1/c7lC6NLJJh6Y1ypGDM9pL+FgWW3i4eGhNbgvs0+W0S1K88J6gAkMUbccO7kEVFafGuDRMloCFqVzbVrX8Qxp16HjOfRYAE8GNO/SYT1uUVfOVNaxAZ4cqAx6TFfOTbAIp/k/F9n9BAN9lkRCppKbAAAAAElFTkSuQmCC",
            transform: TILE_TRANSFORM,
        },
    };

    TILE_TYPE_OPTIONS = {
        [TILE_TYPES.GROUND]: {
            [GROUND_TYPES.GRASS]: {
                stroke: "green",
                fill: "lightgreen",
                useImage: `${TILE_TYPES.GROUND}.${GROUND_TYPES.GRASS}`,
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
