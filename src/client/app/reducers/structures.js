import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { lattice, toDict, dict, choice, range } from '../utils.js'
import { STRUCTURE_TYPES, STRUCTURES, HOUSE_STATS } from './structures/consts.js'

export class StructuresReducer extends Reducer {
    actions = [
        actions.RESIZE_TERRAIN,
        actions.SELECTION_END,
        actions.TICK,
    ];

    initialiseState() {
        Object.assign(this.state, {
            structures: {},
            layers: {
                water: {},
            },
            nextStructureId: 1,
            structuresKeysById: {},
        });
    }

    [actions.TICK] (action) {
        this.regradeHouses();
        this.updateWorks();
        this.updateProduction();
        this.updateLayers();
        this.consumeFood();
        this.updateHousesNeeds();
    }

    regradeHouses() {
        for (const structure of this.structuresList) {
            if (structure.main) {
                continue;
            }
            if (structure.type !== STRUCTURE_TYPES.HOUSE) {
                continue;
            }
            const nonUpgradableLevels = HOUSE_STATS
                .map((houseStats, level) => [level + 1, houseStats.canUpgrade ?
                    houseStats.canUpgrade(structure, this.state) : false])
                .filter(([level, canUpgrade]) => !canUpgrade)
                .map(([level]) => level);
            const nextLevel = nonUpgradableLevels[0] || HOUSE_STATS.length;
            const targetLevel = nextLevel - 1;
            const currentLevel = structure.data.level;
            if (targetLevel === currentLevel) {
                continue;
            }
            const newLevel = targetLevel > currentLevel
                ? currentLevel + 1
                : currentLevel - 1;
            const newHouseStats = HOUSE_STATS[newLevel];
            structure.data.level = newLevel;
            Object.assign(structure.data, newHouseStats.newData);
        }
    }

    updateHousesNeeds() {
        for (const house of this.getStructuresOfType(STRUCTURE_TYPES.HOUSE)) {
            const occupants = house.data.occupants;
            const {needsPerOccupant, needs} = house.data.reserves;
            const newNeeds =
                Object.entries(needsPerOccupant)
                .map(([key, value]) => [key, value * occupants])
                .filter(([key, newNeed]) => newNeed != needs[key]);
            if (!newNeeds.length) {
                continue;
            }
            Object.assign(house.data.reserves.needs, dict(newNeeds));
        }
    }

    consumeFood() {
        for (const house of this.getStructuresOfType(STRUCTURE_TYPES.HOUSE)) {
            const occupants = house.data.occupants;
            if (!occupants) {
                continue;
            }
            const {consumesPerOccupant, has} = house.data.reserves;
            const willConsume = Object.entries(consumesPerOccupant)
                .map(([key, consumes]) =>
                    [key, Math.min(occupants * consumes, (has[key] || 0))])
                .filter(([key, consume]) => consume > 0);
            if (!willConsume.length) {
                continue;
            }
            Object.assign(house.data.reserves.has, dict(willConsume
                .map(([key, consume]) => [key, has[key] - consume])))
        }
    }

    updateWorks() {
        for (const work of this.getStructuresWithDataProperty('workers')) {
            if (work.data.workers.available
                && (work.data.workers.availableUntil < this.ticks)) {
                work.dta.workers.available = false;
            }
        }
    }

    updateProduction() {
        const works = this.getStructuresWithDataProperty('product')
        for (const work of works) {
            const {workers: {allocated, needed}, product: {status, rate, max}} =
                work.data;
            if (status >= max) {
                continue;
            }
            if (!allocated) {
                continue;
            }
            work.data.product.status =
                Math.min(status + rate * allocated / needed, max);
        }
    }

    updateLayers(reset=false) {
        this.updateWater(reset);
    }

    updateWater(reset=false) {
        const waterStructures = this.getStructuresOfType(STRUCTURE_TYPES.WELL);
        this.state.layers.water = {};
        const waterLayer = this.state.layers.water;
        for (const structure of waterStructures) {
            const {x: centerX, y: centerY} = structure.start;
            const {range, level} = structure.data;
            const start = {
                x: Math.max(0, centerX - range),
                y: Math.max(0, centerY - range),
            };
            const end = {
                x: Math.min(centerX + range + 1, this.state.properties.width) ,
                y: Math.min(centerY + range + 1, this.state.properties.height),
            };
            for (const [x, y] of lattice([start.x, end.x], [start.y, end.y])) {
                const key = `${x}.${y}`;
                if (!waterLayer[key] || waterLayer[key] < level) {
                    waterLayer[key] = level;
                }
            }
        }

        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        for (const house of houses) {
            let waterLevel = 0;
            for (const [x, y] of lattice([house.start.x, house.end.x + 1],
                                         [house.start.y, house.end.y + 1])) {
                const key = `${x}.${y}`;
                waterLevel = Math.max(waterLevel, waterLayer[key] || 0);
            }
            house.data.water = waterLevel;
        }
    }

    [actions.RESIZE_TERRAIN] (action) {
        this.resizeStructures();
    }

    resizeStructures() {
        const {width, height} = this.state.properties;
        this.state.structures = {};
        this.state.population = 0;
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const oldStructure = oldStructures[key];
            if (!oldStructure || oldStructure.main) {
                continue;
            }
            const {x: endX, y: endY} = oldStructure.end;
            if (endX >= width || endY >= height) {
                continue;
            }
            this.structures[key] = oldStructure;
            this.state.population += oldStructure.occupants;
        }
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const structure = this.structures[key];
            if (!structure || !structure.main) {
                continue;
            }
            for (const [eX, eY] of this.getStructureTiles(structure)) {
                if (eX === x && eY === y) {
                    continue;
                }
                this.structures[`${eX}.${eY}`] = {main: key};
            }
        }
    }

    resizeLayers() {
        const mapLattice = lattice(width, height);
        for (const layerName in this.state.layers) {
            this.state.layers[layerName] = toDict(mapLattice, key => null);
        }

        this.updateLayers(true);
    }

    getStructureTiles(structure) {
        return lattice(
            [structure.start.x, structure.end.x + 1],
            [structure.start.y, structure.end.y + 1]);
    }

    [actions.SELECTION_END] (action) {
        const {tool, selectedTiles} = action;

        if (tool.toolType === 'SINGLE_STRUCTURE') {
            return this.setStructure(tool, selectedTiles);
        } else if (tool.toolType === 'RANGE_OF_STRUCTURES') {
            return this.setStructures(tool, selectedTiles);
        } else if (tool.toolType === 'CLEAR') {
            return this.clearSpace(selectedTiles);
        }
    }

    clearSpace(selectedTiles) {
        this.clearStructures(selectedTiles);
    }

    clearStructures(selectedTiles) {
        for (const {key} of selectedTiles) {
            let structure = this.structures[key];
            if (!structure) {
                continue;
            }
            if (structure.main) {
                structure = this.structures[structure.main];
            }
            for (const [x, y] of this.getStructureTiles(structure)) {
                delete this.structures[`${x}.${y}`];
            }
            if (structure.type === STRUCTURE_TYPES.HOUSE) {
                this.state.population -= structure.data.occupants;
            }
            delete this.state.structuresKeysById[structure.id];
        }
    }

    setStructures(tile, selectedTiles) {
        for (const selectedTile of selectedTiles) {
            this.setStructure(tile, [selectedTile]);
        }
    }

    setStructure({data: {type, ...extraData}}, selectedTiles) {
        const structureType = STRUCTURES[type];
        if (!structureType) {
            console.error("Unknown structure type: ", type);
            return;
        }
        if (structureType.unique && this.structureTypeExists(type)) {
            return;
        }
        const tile = selectedTiles[0];
        const id = this.state.nextStructureId;
        this.state.nextStructureId += 1;

        const structure = {
            id,
            type,
            start: {x: tile.x, y: tile.y},
            end: {
                x: tile.x + structureType.size.width - 1,
                y: tile.y + structureType.size.height - 1,
            },
            key: `${tile.x}.${tile.y}`,
            renderOptions: structureType.renderOptions,
            textRenderOptions: structureType.textRenderOptions,
            getText: structureType.getText,
            structureSize: structureType.size,
            randomValue: choice(range(64)),
        };
        structure.data = (structureType.makeData || (() => null))(
            structure, extraData);

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (this.structures[key]) {
                return;
            }
        }

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (eX === tile.x && eY === tile.y) {
                this.structures[key] = structure;
            } else {
                this.structures[key] = {main: structure.key, key};
            }
        }

        this.state.structuresKeysById[structure.id] = structure.key;
    }
}
