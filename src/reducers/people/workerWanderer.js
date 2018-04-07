import { Wanderer } from './wanderer.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'

export class WorkerWanderer extends Wanderer {
    shouldAddPerson(structure) {
        const {
            data: {
                [this.wandererKey]: {id, nextOn, spawnWait},
                workers: {allocated, needed},
            },
        } = structure;
        if (id) {
            return false;
        }
        if (!allocated) {
            return false;
        }
        const actualNextOn = nextOn - spawnWait + spawnWait * needed / allocated;
        if (actualNextOn >= this.ticks) {
            return false;
        }

        return true;
    }
}
