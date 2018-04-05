import * as actions from '../../../actions/actions.js'
import { Reducer } from '../../base.js'
import { dict } from '../../../utils.js'

export class LayerReducer extends Reducer {
    actions = [
        actions.TICK,
        actions.RESIZE_TERRAIN,
    ];

    layerName = null;
    defaultLayerValue = undefined;

    initialiseState() {
        this.state.layers[this.layerName] = {};
    }

    [actions.TICK] (action) {
        this.updateLayer();
    }

    [actions.RESIZE_TERRAIN] (action) {
        this.updateLayer();
    }

    resetLayer() {
        this.state.layers[this.layerName] = this.getEmptyLayer();
    }

    updateLayer() {
        const newLayer = this.getEmptyLayer();
        this.fillLayer(newLayer);
        Object.assign(this.state.layers[this.layerName], newLayer);
    }

    getEmptyLayer() {
        return dict(this.getGridLattice().map(
            ([x, y, key]) => [key, this.defaultLayerValue]));
    }

    fillLayer(newLayer) {
        throw new Error("Not implemented");
    }
}
