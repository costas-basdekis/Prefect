import * as actions from '../../actions/actions.js'
import { Reducer } from '../base.js'
import { PEOPLE } from './consts.js'
import { choice, range } from '../../utils.js'

export class Person extends Reducer {
    type = null;

    actions = [
        actions.TICK,
        actions.ANIMATION_TICK,
    ];

    [actions.TICK] (action) {
        this.removePeople();
        this.settlePeople();
        this.tickPeople();
        this.reroutePeople();
        this.updateAccess();
    }

    [actions.ANIMATION_TICK] (action) {
        const {fraction} = action;

        this.movePeople(fraction);
    }

    tickPeople() {
        throw new Error("Not implemented");
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

    reroutePeople() {
        throw new Error("Not implemented");
    }

    updateAccess() {
        throw new Error("Not implemented");
    }

    movePeople(fraction) {
        for (const person of this.getPeopleOfType(this.type)) {
            const {x, y} = person.position;
            const target = this.getMoveTarget(person);
            if (!target) {
                continue;
            }
            const {x: targetX, y: targetY} = target;
            if (x === targetX && y === targetY) {
                continue;
            }

            this.movePerson(person, {targetX, targetY}, fraction);
        }
    }

    getMoveTarget(person) {
        throw new Error("Not implemented");
    }

    movePerson(person, {targetX, targetY}, fraction) {
        if (targetX === undefined || targetY === undefined || isNaN(targetX) || isNaN(targetY)) {
            throw new Error("Got invalid targetX and/or targetY");
        }
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

    shouldRemovePerson(person) {
        throw new Error("Not implemented");
    }

    removePeople() {
        for (const person of this.getPeopleOfType(this.type)) {
            if (!this.shouldRemovePerson(person)) {
                continue;
            }
            this.removePerson(person);
        }
    }

    removePerson(person) {
        throw new Error("Not implemented");
    }
}
