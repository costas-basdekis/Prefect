import * as actions from '../../actions/actions.js'
import { Reducer } from '../base.js'
import { lattice, dict } from '../../utils.js'
import { STRUCTURE_TYPES, STRUCTURES, HOUSE_STATS } from './consts.js'

export class HouseReducer extends Reducer {
    actions = [
        actions.TICK,
    ];

    [actions.TICK] (action) {
        this.updateWater();
        this.regradeHouses();
        this.consumeFood();
        this.updateHousesNeeds();
    }

    updateWater() {
        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        const waterLayer = this.state.layers.water;
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
}
