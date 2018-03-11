import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURE_TYPES } from './structures.js'
import { toDict, sum, lattice } from '../utils.js'

const PEOPLE_TYPES = toDict([
    'NEWCOMER',
    'WORKER_SEEKER',
], key => key);

const PEOPLE = {
    [PEOPLE_TYPES.NEWCOMER]: {
        renderOptions: {
            stroke: "yellow",
            fill: "orange",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.WORKER_SEEKER]: {
        renderOptions: {
            stroke: "yellow",
            fill: "grey",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
};

export class PeopleReducer extends Reducer {
    static actions = [
        actions.TICK,
        actions.ANIMATION_TICK,
    ];

    static [actions.TICK] (state, action) {
        const newState = {...state};

        this.removePeople(newState);
        this.settleNewcomers(newState);
        this.tickNewcomers(newState);
        this.tickSeekerWorkers(newState);

        return newState;
    }

    static [actions.ANIMATION_TICK] (state, action) {
        const {fraction} = action;
        const newState = {...state};

        this.movePeople(newState, fraction);

        return newState;
    }

    static removePeople(state) {
        const oldPeople = state.people;
        for (const person of Object.values(state.people)) {
            if (!this.shouldRemovePerson(state, person)) {
                continue;
            }
            if (oldPeople === state.people) {
                state.structures = {...state.structures};
                state.people = {...state.people};
            }
            this.removePerson(state, person);
        }
    }

    static removePerson(state, person) {
        delete state.people[person.id];
        if (person.type === PEOPLE_TYPES.WORKER_SEEKER) {
            this.removeWorkerSeeker(state, person);
        }
    }

    static removeWorkerSeeker(state, person) {
        const workKey = state.structuresKeysById[person.workId];
        if (!workKey) {
            return;
        }
        const work = state.structures[workKey];
        if (!work) {
            return;
        }
        if (work.id !== person.workId) {
            return;
        }
        state.structures[work.key] = {
            ...work,
            data: {
                ...work.data,
                workerSeekerId: null,
                workerSeekerRemoveOn: null,
                workerSeekerCreatedOn: null,
            },
        };
    }

    static movePeople(state, fraction) {
        this.moveNewcomers(state, fraction);
        this.moveWorkerSeekers(state, fraction);

        return state;
    }

    static moveWorkerSeekers(state, fraction) {
        const oldPeople = state.people;
        const oldStructures = state.structures;
        const allDirections = [
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 0, dy: -1},
        ];
        for (let person of this.getPeopleOfType(state, PEOPLE_TYPES.WORKER_SEEKER)) {
            const {x, y} = person.position;
            if (!person.nextPosition || ((x === person.nextPosition.x) && (y === person.nextPosition.y))) {
                const index = allDirections.indexOf(allDirections.filter(({dx, dy}) => dx === person.direction.dx && dy === person.direction.dy)[0]);
                const directions =
                    allDirections.slice(index).concat(
                        allDirections.slice(0, index));
                const {x, y} = person.position;
                const keys = directions
                    .map(({dx, dy}) => ({x: x + dx, y: y + dy}))
                    .map(({x, y}) => `${x}.${y}`);
                const roads = keys
                    .map(key => state.structures[key])
                    .filter(structure => structure)
                    .filter(structure => structure.type === STRUCTURE_TYPES.ROAD);
                if (!roads.length) {
                    if (oldPeople === state.people) {
                        state.people === {...state.people};
                    }
                    state.people[person.id] = {
                        ...person,
                        hasNoRoads: true,
                    };
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
                        state.structures[person.pastKeys[minIndex]];
                    nextRoad = oldestRoad;
                }
                if (oldPeople === state.people) {
                    state.people === {...state.people};
                }
                const direction = directions[keys.indexOf(nextRoad.key)];
                state.people[person.id] = person = {
                    ...person,
                    currentPosition: {...person.position},
                    nextPosition: {...nextRoad.start},
                    pastKeys: person.pastKeys
                        .filter(key => key != nextRoad.key)
                        .concat([nextRoad.key]),
                    direction,
                };
            }

            const {x: targetX, y: targetY} = person.nextPosition;
            if (x !== targetX || y !== targetY) {
                if (oldPeople === state.people) {
                    state.people = {...state.people};
                }
                person = this.movePerson(state, person, {targetX, targetY}, fraction);
                if (person.position.x === targetX && person.position.y === targetY) {
                    if (this.areThereWorkersAround(state, person.position)) {
                        if (oldStructures === state.structure) {
                            state.structures = {...state.structures};
                        }
                        const work = state.structures[state.structuresKeysById[person.workId]];
                        state.structures[work.key] = {
                            ...work,
                            data: {
                                ...work.data,
                                workersAvailable: true,
                                workersAvailableUntil:
                                    state.date.ticks
                                    + work.data.workersAvailableLength,
                            },
                        };
                    }
                }
            }
        }

        return state;
    }

    static areThereWorkersAround(state, {x, y}) {
        const points = lattice([x - 2, x + 3], [y - 2, y + 3]);
        const keys = points
            .map(([x, y]) => `${x}.${y}`)
            .map(key => state.structures[key]);
        const houses = keys
            .filter(structure => structure)
            .filter(structure => structure.type === STRUCTURE_TYPES.HOUSE);
        const housesWithWorkers = houses
            .filter(structure => structure.data.occupants > 0);
        return housesWithWorkers.length > 0;
    }

    static moveNewcomers(state, fraction) {
        const oldPeople = state.people;
        for (let person of this.getPeopleOfType(state, PEOPLE_TYPES.NEWCOMER)) {
            const structureKey = state.structuresKeysById[person.targetStructureId];
            const structure = state.structures[structureKey];
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = structure.start;
            if (x !== targetX || y !== targetY) {
                if (oldPeople === state.people) {
                    state.people = {...state.people};
                }
                this.movePerson(state, person, {targetX, targetY}, fraction);
            }
        }

        return state;
    }

    static movePerson(state, person, {targetX, targetY}, fraction) {
        const {x, y} = person.position;
        const dX = targetX - x, dY = targetY - y;
        const delta = Math.sqrt(dX * dX + dY * dY);
        let newX, newY;
        const speed = person.speed * fraction;
        if (delta > 0 && delta > speed) {
            const moveX = dX * speed / delta;
            const moveY = dY * speed / delta;
            newX = x + moveX;
            newY = y + moveY;
        } else {
            newX = targetX;
            newY = targetY;
        }
        person = state.people[person.id] = {
            ...person,
            position: {x: newX, y: newY},
        };

        return person;
    }

    static getPeopleOfType(state, type) {
        return Object.values(state.people)
            .filter(person => person.type === type);
    }

    static settleNewcomers(state) {
        const oldStructures = state.structures;
        for (let person of Object.values(state.people)) {
            if (!person.targetStructureId) {
                continue;
            }
            const structureKey = state.structuresKeysById[person.targetStructureId];
            let structure = state.structures[structureKey];
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = structure.start;
            if (x !== targetX || y !== targetY) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
                state.people = {...state.people};
            }
            structure = state.structures[structure.key] = {
                ...structure,
                data: {
                    ...structure.data,
                    newcomers: structure.data.newcomers.filter(id => id !== person.id),
                    occupants: structure.data.occupants + person.count,
                },
            };
            delete state.people[person.id];
            state.population += person.count;
        }
    }

    static shouldRemovePerson(state, person) {
        if (person.type === PEOPLE_TYPES.NEWCOMER) {
            return this.shouldRemoveNewcomer(state, person);
        } else if (person.type === PEOPLE_TYPES.WORKER_SEEKER) {
            return this.shouldRemoveWorkerSeeker(state, person);
        }

        return false;
    }

    static shouldRemoveNewcomer(state, person) {
        const structureKey = state.structuresKeysById[person.targetStructureId];
        if (!structureKey) {
            return true;
        }
        const structure = state.structures[structureKey];
        if (!structure) {
            return true;
        }
        if (structure.id !== person.targetStructureId) {
            return true;
        }
        return false;
    }

    static shouldRemoveWorkerSeeker(state, person) {
        const workKey = state.structuresKeysById[person.workId];
        if (!workKey) {
            return true;
        }
        const work = state.structures[workKey];
        if (!work) {
            return true;
        }
        if (work.id !== person.workId) {
            return true;
        }
        if (work.data.workerSeekerRemoveOn <= state.date.ticks) {
            return true;
        }
        if (!person.nextPosition) {
            return false;
        }
        const key = `${person.nextPosition.x}.${person.nextPosition.y}`;
        const road = state.structures[key];
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

    static tickNewcomers(state) {
        const oldStructures = state.structures;
        const houses = this.getStructuresOfType(state, STRUCTURE_TYPES.HOUSE);
        for (const oldHouse of houses) {
            const spaceLeft = oldHouse.data.space - oldHouse.data.occupants
                - sum(oldHouse.data.newcomers.map(newcomerId => state.people[newcomerId].count));
            if (spaceLeft <= 0) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
                state.people = {...state.people};
            }
            const newcomer = this.createNewcomer(state, spaceLeft, oldHouse.id);
            const house = state.structures[oldHouse.key] = {...oldHouse, data: {...oldHouse.data}};
            house.data.newcomers.push(newcomer.id);
        }

        return state;
    }

    static tickSeekerWorkers(state) {
        const oldStructures = state.structures;
        const works = this.getStructuresWithDataProperty(
            state, 'workerSeekerCreatedOn');
        for (const oldWork of works) {
            if (oldWork.data.workerSeekerId) {
                continue;
            }
            if (oldWork.data.workerSeekerNextOn >= state.date.ticks) {
                continue;
            }
            const adjacentBuildings = this.getAdjacentRoads(state, oldWork);
            const directions = [
                {dx: 1, dy: 0},
                {dx: 0, dy: 1},
                {dx: -1, dy: 0},
                {dx: 0, dy: -1},
            ];
            const actualAdjacentBuildings = adjacentBuildings.filter(s => s);
            if (!actualAdjacentBuildings.length) {
                continue;
            }
            const startRoad = actualAdjacentBuildings[0];
            const direction = directions[adjacentBuildings.indexOf(startRoad)];
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
                state.people = {...state.people};
            }
            const workerSeeker = this.createWorkerSeeker(
                state, oldWork.id, startRoad.start, direction);
            const {workerSeekerLife, workerSeekerSpawnWait} = oldWork.data;
            const work = state.structures[oldWork.key] = {
                ...oldWork,
                data: {
                    ...oldWork.data,
                    workerSeekerCreatedOn: state.date.ticks,
                    workerSeekerRemoveOn: state.date.ticks + workerSeekerLife,
                    workerSeekerNextOn: state.date.ticks
                        + workerSeekerLife + workerSeekerSpawnWait,
                    workerSeekerId: workerSeeker.id,
                },
            };
        }

        return state;
    }

    static getAdjacentRoads(state, structure) {
        const adjacentBuildingsLattices = [
            lattice(
                [structure.start.x, structure.end.x + 1],
                [structure.start.y - 1, structure.start.y],
            ), lattice(
                [structure.end.x + 1, structure.end.x + 2],
                [structure.start.y, structure.end.y + 1],
            ), lattice(
                [structure.end.x, structure.start.x - 1, -1],
                [structure.end.y + 1, structure.end.y + 2],
            ), lattice(
                [structure.start.x - 1, structure.start.x],
                [structure.end.y, structure.end.y - 1, -1],
            )
        ];
        const adjacentBuildings = adjacentBuildingsLattices
            .map(adjacentBuildingsLattice => adjacentBuildingsLattice
                .map(([x, y]) => `${x}.${y}`)
                .map(key => state.structures[key])
                .filter(structure => structure)
                .filter(structure => structure.type === STRUCTURE_TYPES.ROAD)
                [0]
            );

        return adjacentBuildings;
    }

    static getStructuresOfType(state, type) {
        return Object.values(state.structures)
            .filter(tile => tile.type === type);
    }

    static getStructuresWithDataProperty(state, property) {
        return Object.values(state.structures)
            .filter(tile => tile.data && (property in tile.data));
    }

    static createWorkerSeeker(state, workId, {x, y}, {dx, dy}) {
        const workerSeeker = this.createPerson(state, {
            type: PEOPLE_TYPES.WORKER_SEEKER,
            position: {x, y},
            direction: {dx, dy},
            currentPosition: {x, y},
            nextPosition: null,
            hasNoRoads: false,
            key: `${x}.${y}`,
            workId,
            pastKeys: [`${x}.${y}`],
        });

        return workerSeeker;
    }

    static createNewcomer(state, count, targetStructureId) {
        const newcomer = this.createPerson(state, {
            type: PEOPLE_TYPES.NEWCOMER,
            position: this.getEntry(state),
            targetStructureId,
            count,
        });

        return newcomer;
    }

    static createPerson(state, args) {
        const {type, position={x: 0, y: 0}, targetStructureId=null} = args;
        const peopleType = PEOPLE[type];
        const person = {
            ...peopleType,
            ...args,
            id: state.nextPersonId,
            type,
            position,
            targetStructureId,
        }
        state.nextPersonId += 1;
        state.people[person.id] = person;

        return person;
    }

    static getEntry(state) {
        const entryTile = Object.values(state.structures)
            .filter(tile => tile.type === STRUCTURE_TYPES.ENTRY)
            [0];
        if (!entryTile) {
            return;
        }

        return entryTile.start;
    }
}
