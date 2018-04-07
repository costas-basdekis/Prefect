import * as actions from '../../actions/actions.js'
import { Reducer } from '../base.js'
import { lattice } from '../../utils.js'

export class ResizeReducer extends Reducer {
    actions = [
        actions.RESIZE_TERRAIN,
    ];

    [actions.RESIZE_TERRAIN] (action) {
        this.resizeStructures();
    }

    resizeStructures() {
        const {width, height} = this.state.properties;
        this.state.structures = {};
        this.state.population = 0;
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const oldStructure = this.structures[key];
            if (!oldStructure || oldStructure.main) {
                continue;
            }
            const {x: endX, y: endY} = oldStructure.end;
            if (endX >= width || endY >= height) {
                continue;
            }
            this.structures[key] = oldStructure;
            this.state.population += oldStructure.occupants;
        }
        for (const [x, y] of lattice(width, height)) {
            const key = `${x}.${y}`;
            const structure = this.structures[key];
            if (!structure || !structure.main) {
                continue;
            }
            for (const [eX, eY] of this.getStructureTiles(structure)) {
                if (eX === x && eY === y) {
                    continue;
                }
                this.structures[`${eX}.${eY}`] = {main: key};
            }
        }
    }
}
