import React from 'react';
import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCStructures extends BaseGrid {
    static createTile(state, ownProps, {key}) {
        let structure = state.structures[key];
        if (!structure) {
            return null;
        }
        if (structure.main) {
            structure = state.structures[structure.main];
        }
        return structure;
    }

    getTileOptions({tile}) {
        return tile.renderOptions;
    }
}

export const Structures = connect4(UCStructures);
