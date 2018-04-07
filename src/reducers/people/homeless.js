import { Person } from './person.js'
import { PEOPLE_TYPES } from './consts.js'
import { STRUCTURE_TYPES } from '../structures/consts.js'
import { sum } from '../../utils.js'

export class Homeless extends Person {
    type = PEOPLE_TYPES.HOMELESS;

    tickPeople() {
        const houses = this.getStructuresOfType(STRUCTURE_TYPES.HOUSE);
        for (const house of houses) {
            const spaceOverused = house.data.occupants - house.data.space
                - sum(house.data.newcomers.map(newcomerId => this.people[newcomerId].count));
            if (spaceOverused <= 0) {
                continue;
            }
            this.createPerson(spaceOverused, house);
            house.data.occupants -= spaceOverused;
        }
    }

    createPerson(count, sourceStructure) {
        const newcomer = super.createPerson({
            type: this.type,
            position: sourceStructure.start,
            nextPosition: null,
            targetPosition: this.getExit(),
            count,
        });

        return newcomer;
    }

    reroutePeople() {
        //
    }

    settlePeople() {
        //
    }

    updateAccess() {
        //
    }

    getMoveTarget(person) {
        return person.targetPosition;
    }

    shouldRemovePerson(person) {
        if (person.position.x === person.targetPosition.x
            && person.position.y === person.targetPosition.y) {
            return true;
        }

        return false;
    }

    removePerson(person) {
        //
    }
}
