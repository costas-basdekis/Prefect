import { Wanderer } from './wanderer.js'
import { PEOPLE_TYPES } from './consts.js'

export class WorkerSeeker extends Wanderer {
    type = PEOPLE_TYPES.WORKER_SEEKER;
    wandererKey = 'workerSeeker';

    shouldAddPerson(structure) {
        const {data: {[this.wandererKey]: {id, nextOn}}} = structure;
        if (id) {
            return false;
        }
        if (nextOn >= this.ticks) {
            return false;
        }

        return true;
    }

    updateAccess() {
        const workerSeekers = this.getPeopleOfType(this.type);
        for (const person of workerSeekers) {
            if (!this.areThereWorkersAround(person.position)) {
                continue;
            }

            const work = this.getStructureById(person.workId);
            work.data.workers.available = true;
            work.data.workers.availableUntil =
                this.ticks + work.data.workers.availableLength;
        }
    }
}
