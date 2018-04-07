import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURES } from './structures/consts.js'
import { PEOPLE } from './people/consts.js'
import { choice, range } from '../utils.js'

export class StateReducer extends Reducer {
    initialiseState() {
        Object.assign(this.state, {
            money: 10000,
            version: 4,
        });
    }

    static Migrations = [
        {version: 1, migrate: state => {
            state.workerRatio = 0.33;
            state.workers = parseInt(state.population * state.workerRatio, 10);
        }}, {version: 2, migrate: state => {
            state.allocatedWorkers = 0;
            state.neededWorkers = 0;
        }}, {version: 3, migrate: state => {
            for (const tile of Object.values(state.terrain)) {
                tile.randomValue = choice(range(64));
            }
            for (const tile of Object.values(state.structures)) {
                if (tile.main) {
                    continue;
                }
                tile.randomValue = choice(range(64));
            }
            for (const person of Object.values(state.people)) {
                person.randomValue = choice(range(64));
            }
        }}, {version: 4, migrate: state => {
            for (const person of Object.values(state.people)) {
                person.animationFraction = 0;
            }
        }},
    ];

    static migrate(state) {
        let version = state.version || 0;
        console.log(`Got state at v${version}`)
        for (const migration of this.Migrations) {
            if (migration.version <= version) {
                console.log(`Skipped migration at v${migration.version}`);
                continue;
            }
            state = migration.migrate(state) || state;
            state.version = migration.version;
            console.log(`Migrated from v${version} to v${migration.version}`)
        }
        console.log(`State is now at v${state.version}`);

        return state;
    }

    actions = [
        actions.SAVE,
        actions.LOAD,
    ];

    [actions.SAVE] (action) {
        localStorage.setItem('state', JSON.stringify(this.state));
    }

    [actions.LOAD] (action) {
        const stateJson = localStorage.getItem('state');
        if (!stateJson || !stateJson.length) {
            return;
        }
        let newState;
        try {
            newState = JSON.parse(stateJson);
        } catch (e) {
            console.error("Could not load state:", e);
            return;
        }

        newState = this.constructor.migrate(newState);

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
