import * as actions from '../actions/actions.js'
import { CombinedReducer } from './combined.js'
import { HouseReducer } from './structures/house.js'
import { WorkReducer } from './structures/work.js'
import { ProductionReducer } from './structures/production.js'
import { ResizeReducer } from './structures/resize.js'
import { SelectionReducer } from './structures/selection.js'
import { LayersReducer } from './structures/layers.js'

export class StructuresReducer extends CombinedReducer {
    static reducersClasses = [
        HouseReducer,
        WorkReducer,
        ProductionReducer,
        ResizeReducer,
        SelectionReducer,
        LayersReducer,
    ];

    initialiseState() {
        Object.assign(this.state, {
            structures: {},
            nextStructureId: 1,
            structuresKeysById: {},
        });
        super.initialiseState();
    }
}
