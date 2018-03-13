import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURE_TYPES } from './structures.js'
import { toDict, sum, lattice } from '../utils.js'

const PEOPLE_TYPES = toDict([
    'NEWCOMER',
    'WORKER_SEEKER',
    'PREFECT',
    'ENGINEER',
    'CART_PUSHER',
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
    [PEOPLE_TYPES.PREFECT]: {
        renderOptions: {
            stroke: "gold",
            fill: "red",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.ENGINEER]: {
        renderOptions: {
            stroke: "gold",
            fill: "blue",
        },
        textRenderOptions: {
            fill: "white",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.CART_PUSHER]: {
        renderOptions: {
            stroke: "brown",
            fill: "brown",
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
        this.tickPrefects(newState);
        this.tickEngineers(newState);
        this.tickCartPushers(newState);
        this.findWorkers(newState);

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
        } else if (person.type === PEOPLE_TYPES.PREFECT) {
            this.removePrefect(state, person);
        } else if (person.type === PEOPLE_TYPES.ENGINEER) {
            this.removeEngineer(state, person);
        } else if (person.type === PEOPLE_TYPES.CART_PUSHER) {
            this.removeCartPusher(state, person);
        }
    }

    static removeWorkerSeeker(state, person) {
        this.removeWanderer(state, person, 'workerSeeker');
    }

    static removePrefect(state, person) {
        this.removeWanderer(state, person, 'prefect');
    }

    static removeEngineer(state, person) {
        this.removeWanderer(state, person, 'engineer');
    }

    static removeCartPusher(state, person) {
        const work = state.structures[state.structuresKeysById[person.workId]];
        if (!work) {
            return;
        }
        state.structures[work.key] = {
            ...work,
            data: {
                ...work.data,
                cartPusher: {
                    ...work.data.cartPusher,
                    id: null,
                },
            },
        };
    }

    static removeWanderer(state, person, wandererKey) {
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
                [wandererKey]: {
                    ...work.data[wandererKey],
                    id: null,
                    removeOn: null,
                    createdOn: null,
                },
            },
        };
    }

    static movePeople(state, fraction) {
        this.moveNewcomers(state, fraction);
        this.moveWorkerSeekers(state, fraction);
        this.movePrefects(state, fraction);
        this.moveEngineers(state, fraction);
        this.moveCartPushers(state, fraction);

        return state;
    }

    static moveWorkerSeekers(state, fraction) {
        this.moveWanderers(state, fraction, PEOPLE_TYPES.WORKER_SEEKER);
    }

    static movePrefects(state, fraction) {
        this.moveWanderers(state, fraction, PEOPLE_TYPES.PREFECT);
    }

    static moveEngineers(state, fraction) {
        this.moveWanderers(state, fraction, PEOPLE_TYPES.ENGINEER);
    }

    static moveWanderers(state, fraction, type) {
        const oldPeople = state.people;
        const oldStructures = state.structures;
        const allDirections = [
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 0, dy: -1},
        ];
        for (let person of this.getPeopleOfType(state, type)) {
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
            if (x === targetX && y === targetY) {
                continue;
            }

            if (oldPeople === state.people) {
                state.people = {...state.people};
            }
            this.movePerson(
                state, person, {targetX, targetY}, fraction);
        }

        return state;
    }

    static moveCartPushers(state, fraction) {
        const oldPeople = state.people;
        const oldStructures = state.structures;
        for (let person of this.getPeopleOfType(state, PEOPLE_TYPES.CART_PUSHER)) {
            const {x, y} = person.position;
            if (!person.nextPosition ||
                    ((x === person.nextPosition.x)
                     && (y === person.nextPosition.y))) {
                let nextPosition, nextPath, returning;
                if (person.path.length) {
                    nextPosition = person.path[0];
                    nextPath = person.path.slice(1);
                    returning = false;
                } else {
                    if (person.returning) {
                        continue;
                    } else {
                        const store = state.structures[
                            state.structuresKeysById[person.storeId]]
                        if (!store) {
                            continue;
                        }
                        if (sum(Object.values(store.data.storage.has))
                            + person.quantity <= store.data.storage.capacity) {
                            if (oldStructures === state.structures) {
                                state.structures = {...state.structures};
                            }
                            state.structures[store.key] = {
                                ...store,
                                data: {
                                    ...store.data,
                                    storage: {
                                        ...store.data.storage,
                                        has: {
                                            ...store.data.storage.has,
                                            [person.productType]:
                                                (store.data.storage.has[person.productType] || 0)
                                                + person.quantity,
                                        },
                                    },
                                },
                            };
                            const road = state.structures[
                                `${person.position.x}.${person.position.y}`];
                            if (!road) {
                                continue;
                            }
                            const work = state.structures[
                                state.structuresKeysById[person.workId]];
                            if (!work) {
                                continue;
                            }
                            nextPosition = road.start;
                            nextPath = this.getShortestPath(
                                state, road, this.getFirstRoad(state, work).startRoad);
                            if (!nextPath) {
                                continue;
                            }
                            nextPath = nextPath.slice(1);
                            returning = true;
                        } else {
                            const currentRoad = state.structures[
                                `${person.position.x}.${person.position.y}`];
                            const {store: newStore, path} = this.findStoreFor(
                                state, person.productType, 1,  currentRoad);
                            if (!store || !path) {
                                continue;
                            }
                            if (oldPeople === state.people) {
                                state.people = {...state.people};
                            }
                            // TODO: This needs to happen on a big tick
                            // Otherwise they dissapear, since their position is
                            // not on the grid
                            // Or, use animation attributes instead
                            person = state.people[person.id] = {
                                ...person,
                                storeId: store.id,
                            };
                            nextPosition = path[0];
                            nextPath = path.slice(1);
                            returning = false;
                        }
                    }
                }
                if (oldPeople === state.people) {
                    state.people === {...state.people};
                }
                state.people[person.id] = person = {
                    ...person,
                    nextPosition: {...nextPosition},
                    path: nextPath,
                    returning,
                };
            }

            const {x: targetX, y: targetY} = person.nextPosition;
            if (x === targetX && y === targetY) {
                continue;
            }

            if (oldPeople === state.people) {
                state.people = {...state.people};
            }
            this.movePerson(
                state, person, {targetX, targetY}, fraction);
        }

        return state;
    }

    static findWorkers(state) {
        const oldStructures = state.structures;
        const workerSeekers = this.getPeopleOfType(
            state, PEOPLE_TYPES.WORKER_SEEKER);
        for (let person of workerSeekers) {
            if (!this.areThereWorkersAround(state, person.position)) {
                continue;
            }

            if (oldStructures === state.structure) {
                state.structures = {...state.structures};
            }
            const work = state.structures[
                state.structuresKeysById[person.workId]];
            state.structures[work.key] = {
                ...work,
                data: {
                    ...work.data,
                    workers: {
                        ...work.data.workers,
                        available: true,
                        availableUntil:
                            state.date.ticks
                            + work.data.workers.availableLength,
                    },
                },
            };
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
        } else if (person.type === PEOPLE_TYPES.PREFECT) {
            return this.shouldRemovePrefect(state, person);
        } else if (person.type === PEOPLE_TYPES.ENGINEER) {
            return this.shouldRemoveEngineer(state, person);
        } else if (person.type === PEOPLE_TYPES.CART_PUSHER) {
            return this.shouldRemoveCartPusher(state, person);
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
        return this.shouldRemoveWanderer(state, person, 'workerSeeker');
    }

    static shouldRemovePrefect(state, person) {
        return this.shouldRemoveWanderer(state, person, 'prefect');
    }

    static shouldRemoveEngineer(state, person) {
        return this.shouldRemoveWanderer(state, person, 'engineer');
    }

    static shouldRemoveCartPusher(state, person) {
        const work = state.structures[state.structuresKeysById[person.workId]];
        if (!work) {
            return true;
        }
        const store = state.structures[state.structuresKeysById[person.storeId]];
        if (!store) {
            return true;
        }
        if (!person.path.length) {
            if (person.returning) {
                return true;
            } else {
                const road = state.structures[
                    `${person.position.x}.${person.position.y}`];
                if (!road) {
                    return true;
                }
                const path = this.getShortestPath(
                    state, road, this.getFirstRoad(state, store).startRoad);
                if (!path) {
                    return true;
                }
            }
        }

        return false;
    }

    static shouldRemoveWanderer(state, person, wandererKey) {
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
        if (work.data[wandererKey].removeOn <= state.date.ticks) {
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
        this.tickWanderers(
            state, 'workerSeeker',
            (state, work) => true,
            this.createWorkerSeeker.bind(this));

        return state;
    }

    static tickPrefects(state) {
        this.tickWanderers(
            state, 'prefect',
            (state, work) => work.data.workers.allocated > 0,
            this.createPrefect.bind(this));

        return state;
    }

    static tickEngineers(state) {
        this.tickWanderers(
            state, 'engineer',
            (state, work) => work.data.workers.allocated > 0,
            this.createEngineer.bind(this));

        return state;
    }

    static tickCartPushers(state) {
        const oldStructures = state.structures;
        const works = this.getStructuresWithDataProperty(state, 'cartPusher');
        for (let work of works) {
            if (work.data.product.status < 1) {
                continue;
            }
            if (work.data.cartPusher.id) {
                continue;
            }
            const {startRoad, direction} = this.getFirstRoad(state, work);
            if (!startRoad || !direction) {
                continue;
            }
            const {store, path} = this.findStoreFor(
                state, work.data.product.type, 1, work);
            if (!store || !path) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
                state.people = {...state.people};
            }
            work = state.structures[work.key] = {
                ...work,
                data: {
                    ...work.data,
                    product: {
                        ...work.data.product,
                        status: work.data.product.status - 1,
                    },
                },
            };
            const cartPusher = this.createCartPusher(
                state, work, store, path, work.data.product.type, 1);
            this.addCartPusher(state, work, cartPusher);
        }
    }

    static findStoreFor(state, type, quantity, source) {
        const stores = this.getStructuresWithDataProperty(state, 'storage');
        const storesForType = stores
            .filter(store => store.data.storage.accepts[type])
            .filter(store =>
                (sum(Object.values(store.data.storage.has)) + quantity)
                <= store.data.storage.capacity);
        if (!storesForType.length) {
            return {};
        }
        const paths = storesForType
            .map(store => ({store, path: this.getShortestPath(
                state,
                this.getFirstRoad(state, source).startRoad,
                this.getFirstRoad(state, store).startRoad,
            )}))
            .filter(({store, path}) => path);
        if (!paths.length) {
            return {};
        }
        const {store, path} = paths
            .sort((lhs, rhs) => lhs.path.length - rhs.path.length)
            [0];

        return {store, path};
    }

    static getShortestPath(state, startRoad, endRoad) {
        if (!startRoad) {
            return null;
        }
        if (!endRoad) {
            return null;
        }
        const visited = {[startRoad.key]: true};
        const stack = [[startRoad, []]];
        while (stack.length) {
            const [road, path] = stack.shift();
            const nextPath = path.concat([road]);
            if (road.key === endRoad.key) {
                return nextPath.map(road => ({...road.start}));
            }
            const adjacentRoads = this.getAdjacentRoads(state, road)
                .filter(road => road);
            for (const adjacentRoad of adjacentRoads) {
                if (visited[adjacentRoad.key]) {
                    continue;
                }
                stack.push([adjacentRoad, nextPath]);
                visited[adjacentRoad.key] = true;
            }
        }

        return null;
    }

    static tickWanderers(state, wandererKey, canCreateWonderer, createWanderer) {
        const oldStructures = state.structures;
        const works = this.getStructuresWithDataProperty(
            state, wandererKey);
        for (const work of works) {
            if (!canCreateWonderer(state, work)) {
                continue;
            }
            if (!this.shouldAddWanderer(state, work, wandererKey)) {
                continue;
            }
            if (oldStructures === state.structures) {
                state.structures = {...state.structures};
                state.people = {...state.people};
            }
            const {startRoad, direction} = this.getFirstRoad(state, work);
            if (!startRoad || !direction) {
                continue;
            }
            const workerSeeker = createWanderer(
                state, work, startRoad.start, direction);
            this.addWanderer(state, work, wandererKey, workerSeeker);
        }

        return state;
    }

    static shouldAddWanderer(state, structure, wandererKey) {
        const wandererData = structure.data[wandererKey];
        if (wandererData.id) {
            return false;
        }
        if (wandererData.nextOn >= state.date.ticks) {
            return false;
        }

        return true;
    }

    static addWanderer(state, structure, wandererKey, wanderer) {
        const wandererData = structure.data[wandererKey];
        const {life, spawnWait} = wandererData;
        state.structures[structure.key] = {
            ...structure,
            data: {
                ...structure.data,
                [wandererKey]: {
                    ...wandererData,
                    createdOn: state.date.ticks,
                    removeOn: state.date.ticks + life,
                    nextOn: state.date.ticks + life + spawnWait,
                    id: wanderer.id,
                },
            },
        };
    }

    static addCartPusher(state, structure, cartPusher) {
        state.structures[structure.key] = {
            ...structure,
            data: {
                ...structure.data,
                cartPusher: {
                    ...structure.data.cartPusher,
                    id: cartPusher.id,
                },
            },
        };
    }

    static getFirstRoad(state, structure) {
        const directions = [
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 0, dy: -1},
        ];
        if (structure.type === STRUCTURE_TYPES.ROAD) {
            return {startRoad: structure, direction: directions[0]};
        }
        const adjacentBuildings = this.getAdjacentRoads(state, structure);
        const actualAdjacentBuildings = adjacentBuildings.filter(s => s);
        if (!actualAdjacentBuildings.length) {
            return {};
        }
        const startRoad = actualAdjacentBuildings[0];
        const direction = directions[adjacentBuildings.indexOf(startRoad)];

        return {startRoad, direction};
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
                [structure.end.y, structure.start.y - 1, -1],
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

    static createWorkerSeeker(state, work, position, direction) {
        return this.createWanderer(
            state, PEOPLE_TYPES.WORKER_SEEKER, work, position, direction)
    }

    static createPrefect(state, work, position, direction) {
        return this.createWanderer(
            state, PEOPLE_TYPES.PREFECT, work, position, direction)
    }

    static createEngineer(state, work, position, direction) {
        return this.createWanderer(
            state, PEOPLE_TYPES.ENGINEER, work, position, direction)
    }

    static createCartPusher(state, work, store, path, productType, quantity) {
        const cartPusher = this.createPerson(state, {
            type: PEOPLE_TYPES.CART_PUSHER,
            position: path[0],
            path: path.slice(1),
            workId: work.id,
            storeId: store.id,
            productType,
            quantity,
            returning: false,
        });

        return cartPusher;
    }

    static createWanderer(state, type, work, {x, y}, {dx, dy}) {
        const wanderer = this.createPerson(state, {
            type,
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

    static createNewcomer(state, count, targetStructureId) {
        const newcomer = this.createPerson(state, {
            type: PEOPLE_TYPES.NEWCOMER,
            position: this.getEntry(state),
            nextPosition: null,
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
