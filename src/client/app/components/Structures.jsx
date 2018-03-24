import React from 'react';
import { connect4 } from '../utils.js'
import { STRUCTURE_TYPES } from '../reducers/structures.js'
import { BaseGrid, getTileTransform } from './BaseGrid.jsx'

function StructureTextures(key, filename, start, count, xCount=1, yCount=1) {
    return sg2Manager => sg2Manager.loadRange({
        filename, start, count, key,
    }, ({width, height}) =>  ({useTransform: getTileTransform(
        width, height, xCount, yCount)}))
}

function HouseTextures(level, start, count) {
    return StructureTextures(
        `${STRUCTURE_TYPES.HOUSE}.${level}`, "Housng1a.bmp", start, count);
}

function SmallTempleTextures(dedicatedTo, start) {
    return StructureTextures(
        `${STRUCTURE_TYPES.SMALL_TEMPLE}.${dedicatedTo}`, "Security.bmp", start, 1, 2, 2);
}

function RoadTextures(up, right, down, left, start) {
    return StructureTextures(
        `${STRUCTURE_TYPES.ROAD}.${up}.${right}.${down}.${left}`, "Land2a.bmp", start, 1);
}

class UCStructures extends BaseGrid {
    static selectors = {
        ...BaseGrid.selectors,
        structures: (state, ownProps) => state.structures,
    };

    static mapStateToProps(options) {
        return {
            ...super.mapStateToProps(options),
            structures: options.structures,
        };
    }

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
        StructureTextures(STRUCTURE_TYPES.WELL, "Utilitya.bmp", 0, 1),
        StructureTextures(STRUCTURE_TYPES.MARKET, "Commerce.bmp", 0, 1, 2, 2),
        StructureTextures(STRUCTURE_TYPES.GRANARY, "Commerce.bmp", 139, 1, 3, 3),
        StructureTextures(STRUCTURE_TYPES.WHEAT_FARM, "Commerce.bmp", 11, 1, 2, 2),
        StructureTextures(STRUCTURE_TYPES.PREFECTURE, "Security.bmp", 0, 1),
        StructureTextures(STRUCTURE_TYPES.ENGINEERS_POST, "transport.BMP", 55, 1),
        SmallTempleTextures("CERES", 44),
        SmallTempleTextures("NEPTUNE", 46),
        SmallTempleTextures("MERCURY", 48),
        SmallTempleTextures("MARS", 50),
        SmallTempleTextures("VENUS", 52),
        RoadTextures(false, false, false, false, 104),
        RoadTextures(false, false, false, true, 103),
        RoadTextures(false, false, true, false, 102),
        RoadTextures(false, false, true, true, 98),
        RoadTextures(false, true, false, false, 101),
        RoadTextures(false, true, false, true, 93),
        RoadTextures(false, true, true, false, 97),
        RoadTextures(false, true, true, true, 106),
        RoadTextures(true, false, false, false, 100),
        RoadTextures(true, false, false, true, 99),
        RoadTextures(true, false, true, false, 92),
        RoadTextures(true, false, true, true, 107),
        RoadTextures(true, true, false, false, 96),
        RoadTextures(true, true, false, true, 108),
        RoadTextures(true, true, true, false, 105),
        RoadTextures(true, true, true, true, 109),
    ];

    getTileOptions({tile}) {
        let useImageTemplate;
        if (this.props.texturesKeys) {
            if (tile.type === STRUCTURE_TYPES.HOUSE) {
                useImageTemplate = `${STRUCTURE_TYPES.HOUSE}.${tile.data.level}`;
            } else if (tile.type === STRUCTURE_TYPES.SMALL_TEMPLE) {
                useImageTemplate = `${STRUCTURE_TYPES.SMALL_TEMPLE}.${tile.data.dedicatedTo}`;
            } else if (tile.type === STRUCTURE_TYPES.ROAD) {
                const offsets = [
                    {name: "up", dx: 0, dy: -1},
                    {name: "right", dx: 1, dy: 0},
                    {name: "down", dx: 0, dy: 1},
                    {name: "left", dx: -1, dy: 0},
                ];
                const keys = offsets.map(({dx, dy}) => `${tile.start.x + dx}.${tile.start.y + dy}`);
                const isRoad = keys.map(key =>
                    (this.props.structures[key] || {}).type
                    === STRUCTURE_TYPES.ROAD);
                useImageTemplate = `${STRUCTURE_TYPES.ROAD}.${isRoad.join(".")}`;
            } else if (tile.type in this.props.texturesKeys) {
                useImageTemplate = tile.type;
            }
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
