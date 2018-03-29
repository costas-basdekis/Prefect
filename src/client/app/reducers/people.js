import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURE_TYPES } from './structures.js'
import { toDict, dict, sum, lattice, withKey, choice, range } from '../utils.js'

export const PEOPLE_TYPES = toDict([
    'NEWCOMER',
    'HOMELESS',
    'WORKER_SEEKER',
    'PREFECT',
    'ENGINEER',
    'CART_PUSHER',
    'MARKET_SELLER',
    'MARKET_BUYER',
    'PRIEST',
], key => key);

export const PEOPLE = {
    [PEOPLE_TYPES.NEWCOMER]: {
        renderOptions: {
            stroke: "yellow",
            fill: "orange",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.HOMELESS]: {
        renderOptions: {
            stroke: "red",
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
    [PEOPLE_TYPES.MARKET_SELLER]: {
        renderOptions: {
            stroke: "brown",
            fill: "green",
        },
        textRenderOptions: {
            fill: "yellow",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.MARKET_BUYER]: {
        renderOptions: {
            stroke: "brown",
            fill: "green",
        },
        textRenderOptions: {
            fill: "red",
        },
        speed: 1,
    },
    [PEOPLE_TYPES.PRIEST]: {
        renderOptions: {
            stroke: "gold",
            fill: "white",
        },
        textRenderOptions: {
            fill: "gold",
        },
        speed: 1,
        accessDuration: 30,
    },
};

export class PeopleReducer extends Reducer {
    actions = [
        actions.TICK,
        actions.ANIMATION_TICK,
    ];

    initialiseState() {
        Object.assign(this.state, {
            people: {},
            nextPersonId: 1,
            population: 0,
            workers: 0,
            allocatedWorkers: 0,
            neededWorkers: 0,
            workerRatio: 0.33,
        });
    }

    [actions.TICK] (action) {
        this.removePeople();
        this.settleNewcomers();
        this.calculateWorkers();
        this.assignWorkers();
        this.tickNewcomers();
        this.tickHomeless();
        this.tickSeekerWorkers();
        this.tickMarketSellers();
        this.tickMarketBuyers();
        this.tickPrefects();
        this.tickEngineers();
        this.tickPriests();
        this.tickCartPushers();
        this.rerouteCartPushers();
        this.rerouteMarketBuyers();
        this.findWorkers();
        this.giveFoodToHouses();
        this.giveAccessToReligion();
    }

    [actions.ANIMATION_TICK] (action) {
        const {fraction} = action;

        this.movePeople(fraction);
    }

    removePeople() {
        for (const person of this.peopleList) {
            if (!this.shouldRemovePerson(person)) {
                continue;
            }
            this.removePerson(person);
        }
    }

    removePerson(person) {
        delete this.people[person.id];
        if (person.type === PEOPLE_TYPES.WORKER_SEEKER) {
            this.removeWorkerSeeker(person);
        } else if (person.type === PEOPLE_TYPES.PREFECT) {
            this.removePrefect(person);
        } else if (person.type === PEOPLE_TYPES.ENGINEER) {
            this.removeEngineer(person);
        } else if (person.type === PEOPLE_TYPES.PRIEST) {
            this.removePriest(person);
        } else if (person.type === PEOPLE_TYPES.CART_PUSHER) {
            this.removeCartPusher(person);
        } else if (person.type === PEOPLE_TYPES.MARKET_BUYER) {
            this.removeMarketBuyer(person);
        } else if (person.type === PEOPLE_TYPES.MARKET_SELLER) {
            this.removeMarketSeller(person);
        }
    }

    removeWorkerSeeker(person) {
        this.removeWanderer(person, 'workerSeeker');
    }

    removePrefect(person) {
        this.removeWanderer(person, 'prefect');
    }

    removeEngineer(person) {
        this.removeWanderer(person, 'engineer');
    }

    removePriest(person) {
        this.removeWanderer(person, 'priest');
    }

    removeCartPusher(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return;
        }
        work.data.cartPusher.id = null;
    }

    removeMarketBuyer(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return;
        }
        work.data.marketBuyer.id = null;
        work.data.reserves.has[person.productType] =
            (work.data.reserves.has[person.productType] || 0)
            + person.quantity;
        work.data.reserves.needs[person.productType] = Math.max(
            (work.data.reserves.needs[person.productType] || 0)
            - person.quantity,
            0,
        )
    }

    removeMarketSeller(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return;
        }
        work.data.marketSeller.id = null;
    }

    removeWanderer(person, wandererKey) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return;
        }
        if (work.id !== person.workId) {
            return;
        }
        Object.assign(work.data[wandererKey], {
            id: null,
            removeOn: null,
            createdOn: null,
        })
    }

    movePeople(fraction) {
        this.moveNewcomers(fraction);
        this.moveHomeless(fraction);
        this.moveWorkerSeekers(fraction);
        this.moveMarketSellers(fraction);
        this.movePrefects(fraction);
        this.moveEngineers(fraction);
        this.movePriests(fraction);
        this.moveCartPushers(fraction);
        this.moveMarketBuyers(fraction);
    }

    moveWorkerSeekers(fraction) {
        this.moveWanderers(fraction, PEOPLE_TYPES.WORKER_SEEKER);
    }

    moveMarketSellers(fraction) {
        this.moveWanderers(fraction, PEOPLE_TYPES.MARKET_SELLER);
    }

    movePrefects(fraction) {
        this.moveWanderers(fraction, PEOPLE_TYPES.PREFECT);
    }

    moveEngineers(fraction) {
        this.moveWanderers(fraction, PEOPLE_TYPES.ENGINEER);
    }

    movePriests(fraction) {
        this.moveWanderers(fraction, PEOPLE_TYPES.PRIEST);
    }

    moveWanderers(fraction, type) {
        const allDirections = [
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 0, dy: -1},
        ];
        for (const person of this.getPeopleOfType(type)) {
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

    moveCartPushers(fraction) {
        for (const person of this.getPeopleOfType(PEOPLE_TYPES.CART_PUSHER)) {
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = person.nextPosition;
            if (x === targetX && y === targetY) {
                continue;
            }

            this.movePerson(person, {targetX, targetY}, fraction);
        }
    }

    moveMarketBuyers(fraction) {
        for (const person of this.getPeopleOfType(PEOPLE_TYPES.MARKET_BUYER)) {
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = person.nextPosition;
            if (x === targetX && y === targetY) {
                continue;
            }

            this.movePerson(person, {targetX, targetY}, fraction);
        }
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

    giveFoodToHouses() {
        for (const seller of this.getPeopleOfType(PEOPLE_TYPES.MARKET_SELLER)) {
            const houses = this.getNearbyHousesWithPeople(seller.position);
            if (!houses.length) {
                continue;
            }
            const work = this.getStructureById(seller.workId);
            let {has: sellerHas, needs: sellerNeeds} = work.data.reserves;
            for (const house of houses) {
                const {needs, has} = house.data.reserves;
                const willGet = dict(Object.keys(needs)
                    .filter(key => needs[key] > (has[key] || 0))
                    .filter(key => (sellerHas[key] || 0) > 0)
                    .map(key => [key, Math.min(needs[key] - (has[key] || 0), sellerHas[key])])
                );
                if (!Object.keys(willGet).length) {
                    continue;
                }
                Object.assign(work.data.reserves.has,
                    dict(Object.keys(willGet)
                        .map(key => [key, sellerHas[key] - willGet[key]]))
                );
                Object.assign(work.data.reserves.needs,
                    dict(Object.keys(willGet)
                        .map(key => [key, sellerNeeds[key] + willGet[key]]))
                );
                ({has: sellerHas, needs: sellerNeeds} = work.data.reserves);
                Object.assign(house.data.reserves.has,
                    dict(Object.keys(willGet)
                        .map(key => [key, (has[key] || 0) + willGet[key]]))
                );
                Object.assign(house.data.reserves.needs,
                    dict(Object.keys(willGet)
                        .map(key => [key, needs[key] - willGet[key]]))
                );
            }
        }
    }
    giveAccessToReligion() {
        for (const priest of this.getPeopleOfType(PEOPLE_TYPES.PRIEST)) {
            const houses = this.getNearbyHousesWithPeople(priest.position);
            if (!houses.length) {
                continue;
            }
            const {dedicatedTo, accessDuration} = priest;
            const until = this.ticks + accessDuration;
            for (const house of houses) {
                const {religiousAccess} = house.data;
                if ((religiousAccess[dedicatedTo] || 0) >= until) {
                    continue;
                }
                house.data.religiousAccess[dedicatedTo] = until;
            }
        }
    }

    moveNewcomers(fraction) {
        for (const person of this.getPeopleOfType(PEOPLE_TYPES.NEWCOMER)) {
            const structure = this.getStructureById(person.targetStructureId);
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = structure.start;
            if (x !== targetX || y !== targetY) {
                this.movePerson(person, {targetX, targetY}, fraction);
            }
        }
    }

    moveHomeless(fraction) {
        for (const person of this.getPeopleOfType(PEOPLE_TYPES.HOMELESS)) {
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = person.targetPosition;
            if (x !== targetX || y !== targetY) {
                this.movePerson(person, {targetX, targetY}, fraction);
            }
        }
    }

    movePerson(person, {targetX, targetY}, fraction) {
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
        Object.assign(person.position, {x: newX, y: newY});

        return person;
    }

    getPeopleOfType(type) {
        return this.peopleList
            .filter(person => person.type === type);
    }

    settleNewcomers() {
        for (const person of this.peopleList) {
            if (!person.targetStructureId) {
                continue;
            }
            const structure = this.getStructureById(person.targetStructureId);
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = structure.start;
            if (x !== targetX || y !== targetY) {
                continue;
            }
            structure.data.newcomers = structure.data.newcomers
                .filter(id => id !== person.id);
            structure.data.occupants += person.count;
            delete this.people[person.id];
            this.state.population += person.count;
        }
    }

    calculateWorkers() {
        this.state.workers = parseInt(
            this.state.population * this.state.workerRatio);
    }

    assignWorkers() {
        const works = this.getStructuresWithDataProperty('workers')
            .sort(withKey(work => work.key));
        let availableWorkers = this.state.workers;
        let allocatedWorkers = 0;
        let neededWorkers = 0;
        for (const work of works) {
            const allocatedWorkersToWork = Math.min(
                availableWorkers, work.data.workers.needed);
            availableWorkers -= allocatedWorkersToWork;
            allocatedWorkers += allocatedWorkersToWork;
            neededWorkers += work.data.workers.needed;
            if (work.data.workers.allocated === allocatedWorkersToWork) {
                continue;
            }
            work.data.workers.allocated = allocatedWorkersToWork;
        }

        this.state.allocatedWorkers = allocatedWorkers;
        this.state.neededWorkers = neededWorkers;
    }

    shouldRemovePerson(person) {
        if (person.type === PEOPLE_TYPES.NEWCOMER) {
            return this.shouldRemoveNewcomer(person);
        } else if (person.type === PEOPLE_TYPES.HOMELESS) {
            return this.shouldRemoveHomeless(person);
        } else if (person.type === PEOPLE_TYPES.WORKER_SEEKER) {
            return this.shouldRemoveWorkerSeeker(person);
        } else if (person.type === PEOPLE_TYPES.PREFECT) {
            return this.shouldRemovePrefect(person);
        } else if (person.type === PEOPLE_TYPES.ENGINEER) {
            return this.shouldRemoveEngineer(person);
        } else if (person.type === PEOPLE_TYPES.PRIEST) {
            return this.shouldRemovePriest(person);
        } else if (person.type === PEOPLE_TYPES.CART_PUSHER) {
            return this.shouldRemoveCartPusher(person);
        } else if (person.type === PEOPLE_TYPES.MARKET_SELLER) {
            return this.shouldRemoveMarketSeller(person);
        } else if (person.type === PEOPLE_TYPES.MARKET_BUYER) {
            return this.shouldRemoveMarketBuyer(person);
        }

        return false;
    }

    shouldRemoveNewcomer(person) {
        const structure = this.getStructureById(person.targetStructureId);
        if (!structure) {
            return true;
        }
        if (structure.id !== person.targetStructureId) {
            return true;
        }
        return false;
    }

    shouldRemoveHomeless(person) {
        if (person.position.x === person.targetPosition.x
            && person.position.y === person.targetPosition.y) {
            return true;
        }

        return false;
    }

    shouldRemoveWorkerSeeker(person) {
        return this.shouldRemoveWanderer(person, 'workerSeeker');
    }

    shouldRemoveMarketSeller(person) {
        return this.shouldRemoveWanderer(person, 'marketSeller');
    }

    shouldRemovePrefect(person) {
        return this.shouldRemoveWanderer(person, 'prefect');
    }

    shouldRemoveEngineer(person) {
        return this.shouldRemoveWanderer(person, 'engineer');
    }

    shouldRemovePriest(person) {
        return this.shouldRemoveWanderer(person, 'priest');
    }

    shouldRemoveCartPusher(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return true;
        }
        const store = this.getStructureById(person.storeId);
        if (!store) {
            return true;
        }
        if (!person.path) {
            return true;
        }
        if (!person.position) {
            return true;
        }
        if (!person.nextPosition) {
            return true;
        }

        if (person.path.length) {
            return false;
        }

        if (person.returning) {
            return true;
        }

        const road = this.structures[
            `${person.position.x}.${person.position.y}`];
        if (!road) {
            return true;
        }

        const path = this.getShortestPath(
            road, this.getFirstRoad(store).startRoad);
        if (!path) {
            return true;
        }

        return false;
    }

    shouldRemoveMarketBuyer(person) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return true;
        }
        const store = this.getStructureById(person.storeId);
        if (!store) {
            return true;
        }
        if (!person.path) {
            return true;
        }
        if (!person.position) {
            return true;
        }
        if (!person.nextPosition) {
            return true;
        }

        if (person.path.length) {
            return false;
        }

        if (person.returning) {
            return true;
        }

        const road = this.structures[
            `${person.position.x}.${person.position.y}`];
        if (!road) {
            return true;
        }

        const path = this.getShortestPath(
            road, this.getFirstRoad(store).startRoad);
        if (!path) {
            return true;
        }

        return false;
    }

    shouldRemoveWanderer(person, wandererKey) {
        const work = this.getStructureById(person.workId);
        if (!work) {
            return true;
        }
        if (work.id !== person.workId) {
            return true;
        }
        if (work.data[wandererKey].removeOn <= this.ticks) {
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

    tickNewcomers() {
        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        for (const house of houses) {
            const spaceLeft = house.data.space - house.data.occupants
                - sum(house.data.newcomers.map(newcomerId => this.people[newcomerId].count));
            if (spaceLeft <= 0) {
                continue;
            }
            const newcomer = this.createNewcomer(spaceLeft, house.id);
            house.data.newcomers.push(newcomer.id);
        }
    }

    tickHomeless() {
        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        for (const house of houses) {
            const spaceOverused = house.data.occupants - house.data.space;
                - sum(house.data.newcomers.map(newcomerId => this.people[newcomerId].count));
            if (spaceOverused <= 0) {
                continue;
            }
            const homeless = this.createHomeless(spaceOverused, house);
            house.data.occupants -= spaceOverused;
        }
    }

    tickSeekerWorkers() {
        this.tickWanderers(
            'workerSeeker',
            this.shouldAddWorkerSeeker.bind(this),
            this.createWorkerSeeker.bind(this));
    }

    tickMarketSellers() {
        this.tickWanderers(
            'marketSeller',
            this.shouldAddWorker.bind(this),
            this.createMarketSeller.bind(this));
    }

    tickPrefects() {
        this.tickWanderers(
            'prefect',
            this.shouldAddWorker.bind(this),
            this.createPrefect.bind(this));
    }

    tickEngineers() {
        this.tickWanderers(
            'engineer',
            this.shouldAddWorker.bind(this),
            this.createEngineer.bind(this));
    }

    tickPriests() {
        this.tickWanderers(
            'priest',
            this.shouldAddWorker.bind(this),
            this.createPriest.bind(this));
    }

    tickCartPushers() {
        const works = this.getStructuresWithDataProperty('cartPusher');
        for (const work of works) {
            if (work.data.product.status < 1) {
                continue;
            }
            if (work.data.cartPusher.id) {
                continue;
            }
            if (!work.data.workers.allocated) {
                continue;
            }
            const {startRoad, direction} = this.getFirstRoad(work);
            if (!startRoad || !direction) {
                continue;
            }
            const {store, path} = this.findStoreFor(
                work.data.product.type, 1, work);
            if (!store || !path) {
                continue;
            }
            work.data.product.status -= 1;
            const cartPusher = this.createCartPusher(
                work, store, path, work.data.product.type, 1);
            this.addCartPusher(work, cartPusher);
        }
    }

    tickMarketBuyers() {
        const works = this.getStructuresWithDataProperty('marketBuyer');
        for (const work of works) {
            if (work.data.marketBuyer.id) {
                continue;
            }
            const biggestNeedAmount = Object.values(work.data.reserves.needs)
                .sort()
                .reverse()
                [0];
            if (!biggestNeedAmount) {
                continue;
            }
            const biggestNeed = Object.keys(work.data.reserves.needs)
                .filter(key => work.data.reserves.needs[key] === biggestNeedAmount)
                .sort()
                [0];
            const {startRoad, direction} = this.getFirstRoad(work);
            if (!startRoad || !direction) {
                continue;
            }
            const {store, path} = this.findStoreWith(
                biggestNeed, biggestNeedAmount, work);
            if (!store || !path) {
                continue;
            }
            const marketBuyer = this.createMarketBuyer(
                work, store, path, biggestNeed, biggestNeedAmount);
            this.addMarketBuyer(work, marketBuyer);
        }
    }

    rerouteCartPushers() {
        for (const person of this.getPeopleOfType(PEOPLE_TYPES.CART_PUSHER)) {
            let nextPosition, nextPath, returning;
            if (!person.path) {
                continue;
            }
            if (person.path.length) {
                nextPosition = person.path[0];
                nextPath = person.path.slice(1);
                returning = person.returning;
            } else {
                if (person.returning) {
                    continue;
                } else {
                    let store = this.getStructureById(person.storeId);
                    if (!store) {
                        continue;
                    }
                    if (sum(Object.values(store.data.storage.has))
                        + person.quantity <= store.data.storage.capacity) {
                        store.data.storage.has[person.productType] =
                            (store.data.storage.has[person.productType] || 0)
                            + person.quantity;
                        const road = this.structures[
                            `${person.position.x}.${person.position.y}`];
                        if (!road) {
                            continue;
                        }
                        const work = this.getStructureById(person.workId);
                        if (!work) {
                            continue;
                        }
                        nextPath = this.getShortestPath(
                            road, this.getFirstRoad(work).startRoad);
                        if (nextPath) {
                            nextPosition = nextPath[0];
                            nextPath = nextPath.slice(1);
                        } else {
                            nextPosition = null;
                            nextPath = null;
                        }
                        returning = true;
                    } else {
                        const currentRoad = this[
                            `${person.position.x}.${person.position.y}`];
                        let {store: newStore, path} = this.findStoreFor(
                            person.productType, 1,  currentRoad);
                        store = newStore;
                        if (!store || !path) {
                            store = {id: null};
                            path = [null];
                        }
                        person.storeId = store.id;
                        nextPosition = path[0];
                        nextPath = path.slice(1);
                        returning = person.returning;
                    }
                }
            }
            Object.assign(person, {
                nextPosition: {...nextPosition},
                path: nextPath,
                returning,
            });
        }
    }

    rerouteMarketBuyers() {
        for (const person of this.getPeopleOfType(PEOPLE_TYPES.MARKET_BUYER)) {
            let nextPosition, nextPath, returning;
            if (!person.path) {
                continue;
            }
            if (person.path.length) {
                nextPosition = person.path[0];
                nextPath = person.path.slice(1);
                returning = person.returning;
            } else {
                if (person.returning) {
                    const work = this.structures[person.workId];
                    if (!work) {
                        continue;
                    }
                    work.data.reserves.has[person.productType] += person.quantity;
                    work.data.reserves.needs[person.productType] = Math.max(
                        (work.data.reserves.needs[person.productType] || 0)
                        - person.quantity,
                        0,
                    );
                    person.quantity = 0;
                    continue;
                } else {
                    let store = this.getStructureById(person.storeId);
                    if (!store) {
                        continue;
                    }
                    if (store.data.storage.has[person.productType]
                        && store.data.storage.has[person.productType] > 0) {
                        const taken = Math.min(
                            store.data.storage.has[person.productType],
                            person.quantity);
                        store.data.storage.has[person.productType] -= taken;
                        person.quantity = taken;
                        const road = this.structures[
                            `${person.position.x}.${person.position.y}`];
                        if (!road) {
                            continue;
                        }
                        const work = this.getStructureById(person.workId);
                        if (!work) {
                            continue;
                        }
                        nextPath = this.getShortestPath(
                            road, this.getFirstRoad(work).startRoad);
                        if (nextPath) {
                            nextPosition = nextPath[0];
                            nextPath = nextPath.slice(1);
                        } else {
                            nextPosition = null;
                            nextPath = null;
                        }
                        returning = true;
                    } else {
                        const currentRoad = this.structures[
                            `${person.position.x}.${person.position.y}`];
                        let {store: newStore, path} = this.findStoreWith(
                            person.productType, person.quantity,  currentRoad);
                        store = newStore;
                        if (!store || !path) {
                            store = {id: null};
                            path = [null];
                        }
                        person.storeId = store.id;
                        nextPosition = path[0];
                        nextPath = path.slice(1);
                        returning = person.returning;
                    }
                }
            }
            Object.assign(person, {
                nextPosition: {...nextPosition},
                path: nextPath,
                returning,
            });
        }
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

    shouldAddWorkerSeeker(structure, wandererKey) {
        const {data: {[wandererKey]: {id, nextOn}}} = structure;
        if (id) {
            return false;
        }
        if (nextOn >= this.ticks) {
            return false;
        }

        return true;
    }

    shouldAddWorker( structure, wandererKey) {
        const {
            data: {
                [wandererKey]: {id, nextOn, spawnWait},
                workers: {allocated, needed},
            },
        } = structure;
        if (id) {
            return false;
        }
        if (!allocated) {
            return false;
        }
        const actualNextOn = nextOn - spawnWait + spawnWait * needed / allocated;
        if (actualNextOn >= this.ticks) {
            return false;
        }

        return true;
    }

    tickWanderers(wandererKey, shouldAddWanderer, createWanderer) {
        const works = this.getStructuresWithDataProperty(wandererKey);
        for (const work of works) {
            if (!shouldAddWanderer(work, wandererKey)) {
                continue;
            }
            const {startRoad, direction} = this.getFirstRoad(work);
            if (!startRoad || !direction) {
                continue;
            }
            const wanderer = createWanderer(
                work, startRoad.start, direction);
            this.addWanderer(work, wandererKey, wanderer);
        }
    }

    addWanderer(structure, wandererKey, wanderer) {
        const wandererData = structure.data[wandererKey];
        const {life, spawnWait} = wandererData;
        Object.assign(structure.data[wandererKey], {
            createdOn: this.ticks,
            removeOn: this.ticks + life,
            nextOn: this.ticks + life + spawnWait,
            id: wanderer.id,
        });
    }

    addCartPusher(structure, cartPusher) {
        structure.data.cartPusher.id = cartPusher.id;
    }

    addMarketBuyer(structure, marketBuyer) {
        structure.data.marketBuyer.id = marketBuyer.id;
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

    createWorkerSeeker(work, position, direction) {
        return this.createWanderer(
            PEOPLE_TYPES.WORKER_SEEKER, work, position, direction);
    }

    createMarketSeller(work, position, direction) {
        return this.createWanderer(
            PEOPLE_TYPES.MARKET_SELLER, work, position, direction);
    }

    createPrefect(work, position, direction) {
        return this.createWanderer(
            PEOPLE_TYPES.PREFECT, work, position, direction);
    }

    createEngineer(work, position, direction) {
        return this.createWanderer(
            PEOPLE_TYPES.ENGINEER, work, position, direction);
    }

    createPriest(work, position, direction) {
        const wanderer = this.createWanderer(
            PEOPLE_TYPES.PRIEST, work, position, direction);

        wanderer.dedicatedTo = work.data.dedicatedTo;

        return wanderer;
    }

    createCartPusher(work, store, path, productType, quantity) {
        const cartPusher = this.createPerson({
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

    createMarketBuyer(work, store, path, productType, quantity) {
        const cartPusher = this.createPerson({
            type: PEOPLE_TYPES.MARKET_BUYER,
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

    createWanderer(type, work, {x, y}, {dx, dy}) {
        const wanderer = this.createPerson({
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

    createNewcomer(count, targetStructureId) {
        const newcomer = this.createPerson({
            type: PEOPLE_TYPES.NEWCOMER,
            position: this.getEntry(),
            nextPosition: null,
            targetStructureId,
            count,
        });

        return newcomer;
    }

    createHomeless(count, sourceStructure) {
        const newcomer = this.createPerson({
            type: PEOPLE_TYPES.HOMELESS,
            position: sourceStructure.start,
            nextPosition: null,
            targetPosition: this.getExit(),
            count,
        });

        return newcomer;
    }

    createPerson(args) {
        const {type, position={x: 0, y: 0}, targetStructureId=null} = args;
        const peopleType = PEOPLE[type];
        const person = {
            ...peopleType,
            ...args,
            id: this.state.nextPersonId,
            type,
            position,
            targetStructureId,
            randomValue: choice(range(64)),
            animationFraction: 0,
        }
        this.state.nextPersonId += 1;
        this.people[person.id] = person;

        return person;
    }
}
