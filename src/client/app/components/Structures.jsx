import React from 'react';
import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCStructures extends BaseGrid {
    static selectors = {
        ...BaseGrid.selectors,
        structures: (state, ownProps) => state.structures,
    };

    static createTile({structures}, {key}) {
        let structure = structures[key];
        if (!structure) {
            return null;
        }
        if (structure.main) {
            structure = structures[structure.main];
        }
        return structure;
    }

    getTileOptions({tile}) {
        return {
            ...tile.renderOptions,
            text: (tile.getText ? tile.getText(tile) : null),
        };
    }
}

export const Structures = connect4(UCStructures);
