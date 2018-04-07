import { Person } from './person.js'
import { PEOPLE_TYPES } from './consts.js'
import { sum } from '../../utils.js'

export class CartPusher extends Person {
    type = PEOPLE_TYPES.CART_PUSHER;

    tickPeople() {
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
            const cartPusher = this.createPerson(
                work, store, path, work.data.product.type, 1);
            this.addPerson(work, cartPusher);
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

    addPerson(structure, cartPusher) {
        structure.data.cartPusher.id = cartPusher.id;
    }

    getMoveTarget(person) {
        return person.nextPosition;
    }

    // TODO: Some of `reroutePeople` should go in here
    settlePeople() {
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

    updateAccess() {
        //
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
        work.data.cartPusher.id = null;
    }
}
