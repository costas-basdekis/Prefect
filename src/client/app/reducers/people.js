import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURE_TYPES } from './structures.js'
import { toDict, sum } from '../utils.js'

const PEOPLE_TYPES = toDict([
    'NEWCOMER',
], key => key);

const PEOPLE = {
    [PEOPLE_TYPES.NEWCOMER]: {
        renderOptions: {
            stroke: "yellow",
            fill: "orange",
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
        const newState = {
            ...state,
            people: {...state.people},
            structures: {...state.structures},
        };

        this.removeWithMissingTarget(newState);
        this.settleNewcomers(newState);
        this.tickNewcomers(newState);

        return newState;
    }

    static [actions.ANIMATION_TICK] (state, action) {
        const {fraction} = action;
        const newState = {
            ...state,
            people: {...state.people},
        };

        this.movePeople(newState, fraction);

        return newState;
    }

    static removeWithMissingTarget(state) {
        for (const person of Object.values(state.people)) {
            if (!this.shouldRemovePerson(state, person)) {
                continue;
            }
            delete state.people[person.id];
        }
    }

    static movePeople(state, fraction) {
        for (let person of Object.values(state.people)) {
            if (!person.targetStructureId) {
                continue;
            }
            const structureKey = state.structuresKeysById[person.targetStructureId];
            const structure = state.structures[structureKey];
            const {x, y} = person.position;
            const {x: targetX, y: targetY} = structure.start;
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
            if (x !== targetX || y != targetY) {
                person = state.people[person.id] = {
                    ...person,
                    position: {x: newX, y: newY},
                };
            }
        }
    }

    static settleNewcomers(state) {
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
        if (!person.targetStructureId) {
            return false;
        }
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

    static tickNewcomers(state) {
        const houses = Object.values(state.structures)
            .filter(tile => tile.type === STRUCTURE_TYPES.HOUSE);
        for (const oldHouse of houses) {
            const spaceLeft = oldHouse.data.space - oldHouse.data.occupants
                - sum(oldHouse.data.newcomers.map(newcomerId => state.people[newcomerId].count));
            if (spaceLeft <= 0) {
                continue;
            }
            const newcomer = this.createNewcomer(state, spaceLeft, oldHouse.id);
            const house = state.structures[oldHouse.key] = {...oldHouse, data: {...oldHouse.data}};
            house.data.newcomers.push(newcomer.id);
        }

        return state;
    }

    static createNewcomer(state, count, targetStructureId) {
        const newcomer = this.createPerson(state, {
            type: PEOPLE_TYPES.NEWCOMER,
            position: this.getEntry(state),
            targetStructureId,
        });
        newcomer.count = count;

        return newcomer;
    }

    static createPerson(state, {type, position={x: 0, y: 0}, targetStructureId=null}) {
        const peopleType = PEOPLE[type];
        const person = {
            ...peopleType,
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
