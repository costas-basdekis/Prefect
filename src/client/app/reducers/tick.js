import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { dict } from '../utils.js'

export class TickReducer extends Reducer {
    static actions = [
        actions.TICK,
        actions.ANIMATION_TICK,
    ];

    static [actions.TICK] (state, action) {
        return this.tick({...state});
    }

    static tick(state) {
        this.tickDate(state);
        this.resetAnimationIndex(state);

        return state;
    }

    static tickDate(state) {
        state.date = {
            ...state.date,
            day: state.date.day + 1,
            ticks: state.date.ticks + 1,
        };
        if (state.date.day >= 31) {
            state.date.day = 1;
            state.date.month += 1;
            if (state.date.month >= 12) {
                state.date.month = 0;
                state.date.year += 1;
            }
        }

        return state;
    }

    static resetAnimationIndex(state) {
        state.people = dict(Object.entries(state.people).map(([id, person]) =>
            [id, {
                ...person,
                animationFraction: 0,
            }]
        ));
    }

    static [actions.ANIMATION_TICK] (state, {fraction}) {
        return this.advanceAnimationIndex({...state}, fraction);
    }

    static advanceAnimationIndex(state, fraction) {
        state.people = dict(Object.entries(state.people).map(([id, person]) =>
            [id, {
                ...person,
                animationFraction: person.animationFraction + fraction,
            }]
        ));

        return state;
    }
}
