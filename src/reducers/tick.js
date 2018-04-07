import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'

export class TickReducer extends Reducer {
    actions = [
        actions.TICK,
        actions.ANIMATION_TICK,
    ];

    initialiseState() {
        Object.assign(this.state, {
            date: {
                year: -50, month: 0, day: 1,
                ticks: 0,
                start: {year: -50, month: 0, day: 1},
            },
        });
    }

    set ticks(value) {
        this.state.date.ticks = value;
    }

    get day() {
        return this.state.date.day;
    }

    set day(value) {
        this.state.date.day = value;
    }

    get month() {
        return this.state.date.month;
    }

    set month(value) {
        this.state.date.month = value;
    }

    get year() {
        return this.state.date.year;
    }

    set year(value) {
        this.state.date.year = value;
    }

    [actions.TICK] (action) {
        this.tick();
    }

    tick() {
        this.tickDate();
        this.resetAnimationIndex();
    }

    tickDate() {
        this.day += 1;
        this.ticks += 1;
        if (this.day >= 31) {
            this.day = 1;
            this.month += 1;
            if (this.month >= 12) {
                this.month = 0;
                this.year += 1;
            }
        }
    }

    resetAnimationIndex() {
        for (const person of this.peopleList) {
            person.animationFraction = 0;
        }
    }

    [actions.ANIMATION_TICK] ({fraction}) {
        this.advanceAnimationIndex(fraction);
    }

    advanceAnimationIndex(fraction) {
        for (const person of this.peopleList) {
            person.animationFraction += fraction;
        }
    }
}
