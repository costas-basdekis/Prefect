import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'

export class TickReducer extends Reducer {
    static actions = [
        actions.TICK,
    ];

    static [actions.TICK] (state, action) {
        // return this.tick({...state});
        return state;
    }

    static tick(state) {
        this.tickDate(state);

        return state;
    }

    static tickDate(state) {
        state.date = {...state.date, day: state.date.day + 1};
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
}
