import * as actions from '../../../actions/actions.js'
import { LayerReducer } from './layer.js'
import { lattice } from '../../../utils.js'
import { STRUCTURE_TYPES } from '../consts.js'

export class WaterLayerReducer extends LayerReducer {
    layerName = "water";
    defaultLayerValue = 0;

    fillLayer(newLayer) {
        const waterStructures = this.getStructuresOfType(STRUCTURE_TYPES.WELL);
        for (const structure of waterStructures) {
            const {x: centerX, y: centerY} = structure.start;
            const {range, level} = structure.data;
            const start = {
                x: Math.max(0, centerX - range),
                y: Math.max(0, centerY - range),
            };
            const end = {
                x: Math.min(centerX + range + 1, this.state.properties.width) ,
                y: Math.min(centerY + range + 1, this.state.properties.height),
            };
            for (const [x, y] of lattice([start.x, end.x], [start.y, end.y])) {
                const key = `${x}.${y}`;
                if (level > newLayer[key]) {
                    newLayer[key] = level;
                }
            }
        }
    }
}
