import { WorkerWanderer } from './workerWanderer.js'
import { PEOPLE_TYPES } from './consts.js'

export class Prefect extends WorkerWanderer {
    type = PEOPLE_TYPES.PREFECT;
    wandererKey = 'prefect';

    updateAccess() {
        //
    }
}
