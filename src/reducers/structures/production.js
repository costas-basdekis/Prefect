import * as actions from '../../actions/actions.js'
import { Reducer } from '../base.js'

export class ProductionReducer extends Reducer {
    actions = [
        actions.TICK,
    ];

    [actions.TICK] (action) {
        this.updateProduction();
    }

    updateProduction() {
        const works = this.getStructuresWithDataProperty('product')
        for (const work of works) {
            const {workers: {allocated, needed}, product: {status, rate, max}} =
                work.data;
            if (status >= max) {
                continue;
            }
            if (!allocated) {
                continue;
            }
            work.data.product.status =
                Math.min(status + rate * allocated / needed, max);
        }
    }
}
