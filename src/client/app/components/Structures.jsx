import React from 'react';
import { connect4 } from '../utils.js'
import { STRUCTURE_TYPES } from '../reducers/structures.js'
import { BaseGrid, getTileTransform } from './BaseGrid.jsx'

function HouseTextures(level, start, count) {
    return sg2Manager => sg2Manager.loadRange({
        filename: "Housng1a.bmp",
        start,
        count,
        key: `${STRUCTURE_TYPES.HOUSE}.${level}`,
    }, ({width, height}) =>  ({useTransform: getTileTransform(width, height)}))
}

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

    static TEXTURES_DEFINITIONS = [
        HouseTextures(0, 44, 1),
        HouseTextures(1, 1, 2),
        HouseTextures(2, 2, 2),
        HouseTextures(3, 6, 2),
        HouseTextures(4, 8, 2),
        HouseTextures(5, 12, 2),
        HouseTextures(6, 14, 2),
        HouseTextures(7, 18, 2),
        HouseTextures(8, 20, 2),
        HouseTextures(9, 24, 2),
        HouseTextures(10, 26, 2),
    ];

    getTileOptions({tile}) {
        let useImageTemplate;
        if (tile.type === STRUCTURE_TYPES.HOUSE) {
            useImageTemplate = `${STRUCTURE_TYPES.HOUSE}.${tile.data.level}`;
        }
        return {
            ...tile.renderOptions,
            text: (tile.getText ? tile.getText(tile) : null),
            textOptions: tile.textRenderOptions || {},
            structureWidth: tile.structureSize.width,
            structureHeight: tile.structureSize.height,
            useImageTemplate,
        };
    }
}

export const Structures = connect4(UCStructures);
