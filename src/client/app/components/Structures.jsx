import React from 'react';
import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCStructures extends BaseGrid {
    static selectors = {
        ...BaseGrid.selectors,
        structures: (state, ownProps) => state.structures,
    };

    static createTile({structures}, {key}) {
        const structure = structures[key];
        if (!structure) {
            return null;
        }
        if (structure.main) {
            return null;
        }
        return structure;
    }

    getTileOptions({tile}) {
        return {
            ...tile.renderOptions,
            text: (tile.getText ? tile.getText(tile) : null),
            textOptions: tile.textRenderOptions || {},
            structureWidth: tile.structureSize.width,
            structureHeight: tile.structureSize.height,
        };
    }
}

export const Structures = connect4(UCStructures);
