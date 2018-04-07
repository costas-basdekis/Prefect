import * as actions from '../../actions/actions.js'
import { CombinedReducer } from '../combined.js'
import { WaterLayerReducer } from './layers/water.js'

export class LayersReducer extends CombinedReducer {
    static reducersClasses = [
        WaterLayerReducer,
    ];

    initialiseState() {
        this.state.layers = {};
        super.initialiseState();
    }
}
