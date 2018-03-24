import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { STRUCTURES } from './structures.js'
import { PEOPLE } from './people.js'
import { choice, range } from '../utils.js'

export class StateReducer extends Reducer {
    static createInitialState() {
        return {
            properties: {
                width: 25,
                height: 25,
            },
            terrain: {},
            structures: {},
            layers: {
                water: {},
            },
            nextStructureId: 1,
            structuresKeysById: {},
            people: {},
            nextPersonId: 1,
            population: 0,
            workers: 0,
            allocatedWorkers: 0,
            neededWorkers: 0,
            workerRatio: 0.33,
            date: {
                year: -50, month: 0, day: 1,
                ticks: 0,
                start: {year: -50, month: 0, day: 1},
            },
            money: 10000,
            version: 2,
        };
    }

    static Migrations = [
        {version: 1, migrate: state => {
            state.workerRatio = 0.33;
            state.workers = parseInt(state.population * state.workerRatio);
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

        newState = this.migrate(newState);

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
