import { PEOPLE_TYPES } from './people/consts.js'
import { STRUCTURE_TYPES } from './structures/consts.js'
import { lattice, withKey, sum } from '../utils.js'

export class Reducer {
    actions = null;

    static asReducer(state) {
        const reducer = new this(state || {});
        return reducer.reduce.bind(this);
    }

    constructor(state) {
        if (!state) {
            throw new Error("Got invalid state");
        }
        this.state = state;
    }

    initialiseState(state) {
        //
    }

    reduce(state, action) {
        if (!state) {
            throw new Error("Got invalid state");
        }
        if (this.actions.indexOf(action.type) < 0) {
            return;
        }

        this.state = state;
        return this[action.type](action);
    }

    get ticks() {
        return this.state.date.ticks;
    }

    get people() {
        return this.state.people;
    }

    get peopleList() {
        return Object.values(this.people);
    }

    get structures() {
        return this.state.structures;
    }

    get structuresList() {
        return Object.values(this.structures);
    }

    getStructureById(id) {
        return this.structures[this.state.structuresKeysById[id]];
    }

    getStructuresOfType(type) {
        return this.structuresList
            .filter(structure => structure.type === type);
    }

    getStructuresWithDataProperty(property) {
        return this.structuresList
            .filter(tile => tile.data && (property in tile.data));
    }

    structureTypeExists(structureType) {
        return this.getStructuresOfType(structureType).length > 0;
    }

    getPeopleOfType(type) {
        return this.peopleList
            .filter(person => person.type === type);
    }

    getEntry() {
        const entryTile = this.getStructuresOfType("ENTRY")[0];
        if (!entryTile) {
            return {x: 0, y: 0};
        }

        return entryTile.start;
    }

    getExit() {
        const exitTile = this.getStructuresOfType("EXIT")[0];
        if (!exitTile) {
            return {x: this.state.properties.width - 1, y: this.state.properties.height - 1};
        }

        return exitTile.start;
    }

    findStoreFor(type, quantity, source) {
        const stores = this.getStructuresWithDataProperty('storage');
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
                this.getFirstRoad(source).startRoad,
                this.getFirstRoad(store).startRoad,
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

    findStoreWith(type, quantity, target) {
        const stores = this.getStructuresWithDataProperty('storage');
        const storesWithType = stores
            .filter(store => store.data.storage.has[type])
            .sort(withKey(store => Object.values(store.data.storage.has[type])))
            .reverse();
        if (!storesWithType.length) {
            return {};
        }
        const paths = storesWithType
            .map(store => ({store, path: this.getShortestPath(
                this.getFirstRoad(target).startRoad,
                this.getFirstRoad(store).startRoad,
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

    getShortestPath(startRoad, endRoad) {
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
            const adjacentRoads = this.getAdjacentRoads(road)
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

    getFirstRoad(structure) {
        const directions = [
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 0, dy: -1},
        ];
        if (structure.type === STRUCTURE_TYPES.ROAD) {
            return {startRoad: structure, direction: directions[0]};
        }
        const adjacentBuildings = this.getAdjacentRoads(structure);
        const actualAdjacentBuildings = adjacentBuildings.filter(s => s);
        if (!actualAdjacentBuildings.length) {
            return {};
        }
        const startRoad = actualAdjacentBuildings[0];
        const direction = directions[adjacentBuildings.indexOf(startRoad)];

        return {startRoad, direction};
    }

    getAdjacentRoads(structure) {
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
                .map(key => this.structures[key])
                .filter(structure => structure)
                .filter(structure => structure.type === STRUCTURE_TYPES.ROAD)
                [0]
            );

        return adjacentBuildings;
    }

    findWorkers() {
        const workerSeekers = this.getPeopleOfType(PEOPLE_TYPES.WORKER_SEEKER);
        for (const person of workerSeekers) {
            if (!this.areThereWorkersAround(person.position)) {
                continue;
            }

            const work = this.getStructureById(person.workId);
            work.data.workers.available = true;
            work.data.workers.availableUntil =
                this.ticks + work.data.workers.availableLength;
        }
    }

    areThereWorkersAround({x, y}) {
        const housesWithWorkers = this.getNearbyHousesWithPeople({x, y});
        return housesWithWorkers.length > 0;
    }

    getNearbyHousesWithPeople({x, y}) {
        const points = lattice([x - 2, x + 3], [y - 2, y + 3]);
        const keys = points
            .map(([x, y]) => `${x}.${y}`)
            .map(key => this.structures[key]);
        const houses = keys
            .filter(structure => structure)
            .filter(structure => structure.type === STRUCTURE_TYPES.HOUSE);
        const housesWithPeople = houses
            .filter(structure => structure.data.occupants > 0);
        return housesWithPeople;
    }

    getStructureTiles(structure) {
        return lattice(
            [structure.start.x, structure.end.x + 1],
            [structure.start.y, structure.end.y + 1]);
    }

    getGridLattice() {
        return lattice(this.state.properties.width, this.state.properties.height)
            .map(([x, y]) => [x, y, `${x}.${y}`]);
    }
}
