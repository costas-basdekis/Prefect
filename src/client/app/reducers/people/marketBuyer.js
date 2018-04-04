import { Person } from './person.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'

export class MarketBuyer extends Person {
    type = PEOPLE_TYPES.MARKET_BUYER;

    tickPeople() {
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
            const marketBuyer = this.createPerson(
                work, store, path, biggestNeed, biggestNeedAmount);
            this.addPerson(work, marketBuyer);
        }
    }

    createPerson(work, store, path, productType, quantity) {
        const cartPusher = super.createPerson({
            type: this.type,
            position: path[0],
            nextPosition: path[0],
            path: path.slice(1),
            workId: work.id,
            storeId: store.id,
            productType,
            quantity,
            returning: false,
        });

        return cartPusher;
    }

    addPerson(structure, marketBuyer) {
        structure.data.marketBuyer.id = marketBuyer.id;
    }

    getMoveTarget(person) {
        return person.nextPosition;
    }

    // TODO: Some of `reroutePeople` should go in here
    settlePeople() {
        //
    }

    updateAccess() {
        //
    }

    reroutePeople() {
        for (const person of this.getPeopleOfType(this.type)) {
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
            if (nextPosition.x === undefined || nextPosition.y === undefined || isNaN(nextPosition.x) || isNaN(nextPosition.y)) {
                throw new Error("Got invalid next position");
            }
            Object.assign(person, {
                nextPosition: {...nextPosition},
                path: nextPath,
                returning,
            });
        }
    }

    shouldRemovePerson(person) {
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

    removePerson(person) {
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
}
