import * as actions from '../actions/actions.js'
import { Reducer } from './base.js'
import { withKey } from '../utils.js'

export class WorkerReducer extends Reducer {
    actions = [
        actions.TICK,
    ];

    initialiseState() {
        Object.assign(this.state, {
            workers: 0,
            allocatedWorkers: 0,
            neededWorkers: 0,
            workerRatio: 0.33,
        });
    }

    [actions.TICK] (action) {
        this.calculateWorkers();
        this.assignWorkers();
    }

    calculateWorkers() {
        this.state.workers = parseInt(
            this.state.population * this.state.workerRatio);
    }

    assignWorkers() {
        const works = this.getStructuresWithDataProperty('workers')
            .sort(withKey(work => work.key));
        let availableWorkers = this.state.workers;
        let allocatedWorkers = 0;
        let neededWorkers = 0;
        for (const work of works) {
            const allocatedWorkersToWork = Math.min(
                availableWorkers, work.data.workers.needed);
            availableWorkers -= allocatedWorkersToWork;
            allocatedWorkers += allocatedWorkersToWork;
            neededWorkers += work.data.workers.needed;
            if (work.data.workers.allocated === allocatedWorkersToWork) {
                continue;
            }
            work.data.workers.allocated = allocatedWorkersToWork;
        }

        this.state.allocatedWorkers = allocatedWorkers;
        this.state.neededWorkers = neededWorkers;
    }
}
