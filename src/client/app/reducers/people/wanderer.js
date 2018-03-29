import { Person } from './person.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'
import { STRUCTURE_TYPES } from '../structures.js'

export class Wanderer extends Person {
    wandererKey = null;

    tickPeople() {
        const works = this.getStructuresWithDataProperty(this.wandererKey);
        for (const work of works) {
            if (!this.shouldAddPerson(work)) {
                continue;
            }
            const {startRoad, direction} = this.getFirstRoad(work);
            if (!startRoad || !direction) {
                continue;
            }
            const wanderer = this.createPerson(work, startRoad.start, direction);
            this.addPerson(work, wanderer);
        }
    }

    shouldAddPerson(person) {
        throw new Error("Not implemented");
    }

    createPerson(work, {x, y}, {dx, dy}) {
        const wanderer = super.createPerson({
            type: this.type,
            position: {x, y},
            direction: {dx, dy},
            currentPosition: {x, y},
            nextPosition: null,
            hasNoRoads: false,
            key: `${x}.${y}`,
            workId: work.id,
            pastKeys: [`${x}.${y}`],
        });

        return wanderer;
    }

    addPerson(structure, wanderer) {
        const wandererData = structure.data[this.wandererKey];
        const {life, spawnWait} = wandererData;
        Object.assign(structure.data[this.wandererKey], {
            createdOn: this.ticks,
            removeOn: this.ticks + life,
            nextOn: this.ticks + life + spawnWait,
            id: wanderer.id,
        });
    }

    // TODO: Part of `movePeople` should go in here
    reroutePeople() {
        //
    }

    settlePeople() {
        //
    }

    movePeople(fraction) {
        const allDirections = [
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 0, dy: -1},
        ];
        for (const person of this.getPeopleOfType(this.type)) {
            const {x, y} = person.position;
            if (!person.nextPosition ||
                    ((x === person.nextPosition.x)
                     && (y === person.nextPosition.y))) {
                const index = allDirections.indexOf(
                    allDirections.filter(({dx, dy}) =>
                        dx === person.direction.dx
                        && dy === person.direction.dy)[0]);
                const directions =
                    allDirections.slice(index).concat(
                        allDirections.slice(0, index));
                const {x, y} = person.position;
                const keys = directions
                    .map(({dx, dy}) => ({x: x + dx, y: y + dy}))
                    .map(({x, y}) => `${x}.${y}`);
                const roads = keys
                    .map(key => this.structures[key])
                    .filter(structure => structure)
                    .filter(structure => structure.type === STRUCTURE_TYPES.ROAD);
                if (!roads.length) {
                    person.hasNoRoads = true;
                    continue;
                }
                let nextRoad;
                const newRoad = roads
                    .filter(road => person.pastKeys.indexOf(road.key) < 0)[0];
                if (newRoad) {
                    nextRoad = newRoad;
                } else {
                    const minIndex = Math.min(...roads
                        .map(road => person.pastKeys.indexOf(road.key))
                        .filter(index => index >= 0));
                    const oldestRoad =
                        this.structures[person.pastKeys[minIndex]];
                    nextRoad = oldestRoad;
                }
                const direction = directions[keys.indexOf(nextRoad.key)];
                Object.assign(person, {
                    currentPosition: {...person.position},
                    nextPosition: {...nextRoad.start},
                    pastKeys: person.pastKeys
                        .filter(key => key != nextRoad.key)
                        .concat([nextRoad.key]),
                    direction,
                });
            }

            const {x: targetX, y: targetY} = person.nextPosition;
            if (x === targetX && y === targetY) {
                continue;
            }

            this.movePerson(person, {targetX, targetY}, fraction);
        }
    }

    shouldRemovePerson(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return true;
        }
        if (work.id !== person.workId) {
            return true;
        }
        if (work.data[this.wandererKey].removeOn <= this.ticks) {
            return true;
        }
        if (!person.nextPosition) {
            return false;
        }
        const key = `${person.nextPosition.x}.${person.nextPosition.y}`;
        const road = this.structures[key];
        if (!road) {
            return true;
        }
        if (road.type !== STRUCTURE_TYPES.ROAD) {
            return true;
        }
        if (person.hasNoRoads) {
            return true;
        }
        return false;
    }

    removePerson(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return;
        }
        if (work.id !== person.workId) {
            return;
        }
        Object.assign(work.data[this.wandererKey], {
            id: null,
            removeOn: null,
            createdOn: null,
        })
    }
}
