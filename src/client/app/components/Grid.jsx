import React from 'react';
import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCGrid extends BaseGrid {
    mouseEvents = true;

    static createTile(state, ownProps, tile) {
        return true;
    }

    OPTIONS = {
        true: {
            stroke: "red",
            strokeWidth: 3,
        },
    }

    getTileOptions(tile) {
        const isHovered = this.isHovered(tile.x, tile.y);
        const options = this.OPTIONS[isHovered] || {};
        return options;
    }
}

export const Grid = connect4(UCGrid);
