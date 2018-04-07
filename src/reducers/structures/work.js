import * as actions from '../../actions/actions.js'
import { Reducer } from '../base.js'

export class WorkReducer extends Reducer {
    actions = [
        actions.TICK,
    ];

    [actions.TICK] (action) {
        this.updateWorks();
    }

    updateWorks() {
        for (const work of this.getStructuresWithDataProperty('workers')) {
            if (work.data.workers.available
                && (work.data.workers.availableUntil < this.ticks)) {
                work.dta.workers.available = false;
            }
        }
    }
}
