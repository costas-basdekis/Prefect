import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { dict } from '../utils.js'

export class TickReducer extends Reducer {
    static actions = [
        actions.TICK,
        actions.ANIMATION_TICK,
    ];

    static [actions.TICK] (state, action) {
        this.tick(state);
    }

    static tick(state) {
        this.tickDate(state);
        this.resetAnimationIndex(state);

        return state;
    }

    static tickDate(state) {
        state.date.day += 1;
        state.date.ticks += 1;
        if (state.date.day >= 31) {
            state.date.day = 1;
            state.date.month += 1;
            if (state.date.month >= 12) {
                state.date.month = 0;
                state.date.year += 1;
            }
        }
    }

    static resetAnimationIndex(state) {
        for (const person of Object.values(state.people)) {
            person.animationFraction = 0;
        }
    }

    static [actions.ANIMATION_TICK] (state, {fraction}) {
        this.advanceAnimationIndex(state, fraction);
    }

    static advanceAnimationIndex(state, fraction) {
        for (const person of Object.values(state.people)) {
            person.animationFraction += fraction;
        }
    }
}
