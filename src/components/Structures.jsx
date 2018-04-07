import { connect4 } from '../utils.js'
import { STRUCTURE_TYPES } from '../reducers/structures/consts.js'
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

    static createTile({structures}, {x, y, key}) {
        const structure = structures[key];
        if (!structure) {
            return null;
        }
        if (structure.main) {
            return null;
        }

        if (structure.type === STRUCTURE_TYPES.WHEAT_FARM) {
            return [
                {x, y, key, tile: {...structure, structureSize: {width: 2, height: 2}}},
                {x, y: y + 2, key: `${key}.crop.0`, tile: {parent: structure, type: `${STRUCTURE_TYPES.WHEAT_FARM}.crop`, index: 0, randomValue: 0, renderOptions: {...structure.renderOptions, structureWidth: 1, structureHeight: 1}}},
                {x: x + 1, y: y + 2, key: `${key}.crop.1`, tile: {parent: structure, type: `${STRUCTURE_TYPES.WHEAT_FARM}.crop`, index: 1, randomValue: 0, renderOptions: {...structure.renderOptions, structureWidth: 1, structureHeight: 1}}},
                {x: x + 2, y: y + 2, key: `${key}.crop.2`, tile: {parent: structure, type: `${STRUCTURE_TYPES.WHEAT_FARM}.crop`, index: 2, randomValue: 0, renderOptions: {...structure.renderOptions, structureWidth: 1, structureHeight: 1}}},
                {x: x + 2, y: y + 1, key: `${key}.crop.3`, tile: {parent: structure, type: `${STRUCTURE_TYPES.WHEAT_FARM}.crop`, index: 3, randomValue: 0, renderOptions: {...structure.renderOptions, structureWidth: 1, structureHeight: 1}}},
                {x: x + 2, y, key: `${key}.crop.4`, tile: {parent: structure, type: `${STRUCTURE_TYPES.WHEAT_FARM}.crop`, index: 4, randomValue: 0, renderOptions: {...structure.renderOptions, structureWidth: 1, structureHeight: 1}}},
            ];
        }

        return structure;
    }

    static TEXTURES_DEFINITIONS = [
        StructureTextures(`${STRUCTURE_TYPES.ENTRY}.up`, "land3a.BMP", 84, 1),
        StructureTextures(`${STRUCTURE_TYPES.ENTRY}.right`, "land3a.BMP", 87, 1),
        StructureTextures(`${STRUCTURE_TYPES.ENTRY}.down`, "land3a.BMP", 86, 1),
        StructureTextures(`${STRUCTURE_TYPES.ENTRY}.left`, "land3a.BMP", 85, 1),
        StructureTextures(`${STRUCTURE_TYPES.EXIT}.up`, "land3a.BMP", 88, 1),
        StructureTextures(`${STRUCTURE_TYPES.EXIT}.right`, "land3a.BMP", 91, 1),
        StructureTextures(`${STRUCTURE_TYPES.EXIT}.down`, "land3a.BMP", 90, 1),
        StructureTextures(`${STRUCTURE_TYPES.EXIT}.left`, "land3a.BMP", 89, 1),
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
        StructureTextures(`${STRUCTURE_TYPES.WHEAT_FARM}.crop.0`, "Commerce.bmp", 12, 1),
        StructureTextures(`${STRUCTURE_TYPES.WHEAT_FARM}.crop.1`, "Commerce.bmp", 13, 1),
        StructureTextures(`${STRUCTURE_TYPES.WHEAT_FARM}.crop.2`, "Commerce.bmp", 14, 1),
        StructureTextures(`${STRUCTURE_TYPES.WHEAT_FARM}.crop.3`, "Commerce.bmp", 15, 1),
        StructureTextures(`${STRUCTURE_TYPES.WHEAT_FARM}.crop.4`, "Commerce.bmp", 16, 1),
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

    getTileOrder(tile, options) {
        return (tile.x + options.structureWidth - 1)
            + (tile.y + options.structureHeight - 1)
            // Large buildings should be rendered before 1-tile buildings, in
            // the same line
            + ((options.structureWidth > 1 || options.structureHeight > 1)
                ? -0.5 : 0);
    }

    getTileOptions({tile}) {
        let useImageTemplate;
        const offsets = [
            {name: "up", dx: 0, dy: -1},
            {name: "right", dx: 1, dy: 0},
            {name: "down", dx: 0, dy: 1},
            {name: "left", dx: -1, dy: 0},
        ];
        if (this.props.texturesKeys) {
            if (tile.type === STRUCTURE_TYPES.ENTRY) {
                const neighbours = offsets.map(({name, dx, dy}) => ({name, x: tile.start.x + dx, y: tile.start.y + dy}));
                const isOutOfMap = neighbours.filter(({x, y}) =>
                    (x < 0) || (x >= this.props.properties.width)
                    || (y < 0) || (y >= this.props.properties.height));
                const direction = (isOutOfMap[0] || {name: "up"}).name;
                useImageTemplate = `${STRUCTURE_TYPES.ENTRY}.${direction}`;
            } else if (tile.type === STRUCTURE_TYPES.EXIT) {
                const neighbours = offsets.map(({name, dx, dy}) => ({name, x: tile.start.x + dx, y: tile.start.y + dy}));
                const isOutOfMap = neighbours.filter(({x, y}) =>
                    (x < 0) || (x >= this.props.properties.width)
                    || (y < 0) || (y >= this.props.properties.height));
                const direction = (isOutOfMap[0] || {name: "up"}).name;
                useImageTemplate = `${STRUCTURE_TYPES.EXIT}.${direction}`;
            } else if (tile.type === STRUCTURE_TYPES.HOUSE) {
                useImageTemplate = `${STRUCTURE_TYPES.HOUSE}.${tile.data.level}`;
            } else if (tile.type === STRUCTURE_TYPES.SMALL_TEMPLE) {
                useImageTemplate = `${STRUCTURE_TYPES.SMALL_TEMPLE}.${tile.data.dedicatedTo}`;
            } else if (tile.type === STRUCTURE_TYPES.ROAD) {
                const keys = offsets.map(({dx, dy}) => `${tile.start.x + dx}.${tile.start.y + dy}`);
                const isRoad = keys.map(key =>
                    (this.props.structures[key] || {}).type
                    === STRUCTURE_TYPES.ROAD);
                useImageTemplate = `${STRUCTURE_TYPES.ROAD}.${isRoad.join(".")}`;
            } else if (tile.type === `${STRUCTURE_TYPES.WHEAT_FARM}.crop`) {
                const CROP_COUNT = 5;
                const CROP_ANIMATION_COUNT = 5;
                const CROP_PERCENTAGE = 1 / CROP_COUNT;
                const status = tile.parent.data.product.status % 1;
                const minStatus = CROP_PERCENTAGE * tile.index, maxStatus = CROP_PERCENTAGE * (tile.index + 1);
                const cropStatus = ((status < minStatus) ? minStatus : ((status > maxStatus) ? maxStatus : status)) - minStatus;
                const cropIndex = parseInt((cropStatus / CROP_PERCENTAGE * (CROP_ANIMATION_COUNT - 1)).toFixed(0), 10);
                useImageTemplate = `${STRUCTURE_TYPES.WHEAT_FARM}.crop.${cropIndex}`;
            } else if (tile.type in this.props.texturesKeys) {
                useImageTemplate = tile.type;
            }
        }
        if (!tile.parent) {
            return {
                ...tile.renderOptions,
                text: (tile.getText ? tile.getText(tile) : null),
                textOptions: tile.textRenderOptions || {},
                structureWidth: tile.structureSize.width,
                structureHeight: tile.structureSize.height,
                useImageTemplate,
            };
        } else {
            return {
                ...tile.renderOptions,
                useImageTemplate,
            };
        }
    }
}

export const Structures = connect4(UCStructures);
