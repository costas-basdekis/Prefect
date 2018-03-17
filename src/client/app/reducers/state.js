import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURES } from './structures.js'
import { PEOPLE } from './people.js'

export class StateReducer extends Reducer {
    static actions = [
        actions.SAVE,
        actions.LOAD,
    ];

    static [actions.SAVE] (state, action) {
        localStorage.setItem('state', JSON.stringify(state));
        return state;
    }

    static [actions.LOAD] (state, action) {
        const stateJson = localStorage.getItem('state');
        if (!stateJson || !stateJson.length) {
            return state;
        }
        let newState;
        try {
            newState = JSON.parse(stateJson);
        } catch (e) {
            console.error("Could not load state:", e);
            return state;
        }

        for (const structure of Object.values(newState.structures)) {
            const type = STRUCTURES[structure.type];
            if (!type) {
                continue;
            }
            if (type.getText) {
                structure.getText = type.getText;
            }
        }

        for (const person of Object.values(newState.people)) {
            const type = PEOPLE[person.type];
            if (!type) {
                continue;
            }
            if (type.getText) {
                person.getText = type.getText;
            }
        }

        return newState;
    }
}
