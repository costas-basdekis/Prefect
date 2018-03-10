import React from 'react';
import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCGrid extends BaseGrid {
    mouseEvents = true;

    static selectors = {
        ...BaseGrid.selectors,
        hovered: (state, ownProps) => ownProps.hovered,
        selection: (state, ownProps) => ownProps.selection,
        isHovered: (state, ownProps) => ownProps.isHovered,
        isSelected: (state, ownProps) => ownProps.isSelected,
    };

    static createTile(options, tile) {
        const isHovered = options.isHovered(tile.x, tile.y);
        const isSelected = options.isSelected(tile.x, tile.y);

        return {isHovered, isSelected};
    }

    OPTIONS = {
        true: {
            true: {
                stroke: "red",
                strokeWidth: 3,
            },
            false: {
                stroke: "red",
                strokeWidth: 3,
            },
        },
        false: {
            true: {
                stroke: "blue",
                strokeWidth: 3,
            },
        },
    }

    getTileOptions(tile) {
        const hoveredOptions = this.OPTIONS[tile.tile.isHovered] || {};
        const options = hoveredOptions[tile.tile.isSelected] || {};
        return options;
    }
}

export const Grid = connect4(UCGrid);
