import { WorkerWanderer } from './workerWanderer.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'

export class Engineer extends WorkerWanderer {
    type = PEOPLE_TYPES.ENGINEER;
    wandererKey = 'engineer';

    updateAccess() {
        //
    }
}
