import React from 'react';
import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCRoads extends BaseGrid {
    static createTile(state, ownProps, {x, y, key}) {
        return state.roads[`${x}.${y}`];
    }

    OPTIONS = {
        stroke: "beige",
        fill: "white",
    };

    getTileOptions(tile) {
        return this.OPTIONS;
    }
}

export const Roads = connect4(UCRoads);
