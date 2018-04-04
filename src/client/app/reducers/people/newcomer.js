import { Person } from './person.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'
import { STRUCTURE_TYPES } from '../structures/consts.js'

export class Newcomer extends Person {
    type = PEOPLE_TYPES.NEWCOMER;

    tickPeople() {
        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        for (const house of houses) {
            const spaceLeft = house.data.space - house.data.occupants
                - sum(house.data.newcomers.map(newcomerId => this.people[newcomerId].count));
            if (spaceLeft <= 0) {
                continue;
            }
            const newcomer = this.createPerson(spaceLeft, house.id);
            house.data.newcomers.push(newcomer.id);
        }
    }

    createPerson(count, targetStructureId) {
        const newcomer = super.createPerson({
            type: this.type,
            position: this.getEntry(),
            nextPosition: null,
            targetStructureId,
            count,
        });

        return newcomer;
    }

    reroutePeople() {
        //
    }

    updateAccess() {
        //
    }

    getMoveTarget(person) {
        const structure = this.getStructureById(person.targetStructureId);
        if (!structure) {
            return;
        }
        return structure.start;
    }

    settlePeople() {
        // TODO: This should only loop over newcomers
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

    shouldRemovePerson(person) {
        const structure = this.getStructureById(person.targetStructureId);
        if (!structure) {
            return true;
        }
        if (structure.id !== person.targetStructureId) {
            return true;
        }
        return false;
    }

    removePerson() {
        //
    }
}
