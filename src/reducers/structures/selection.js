import * as actions from '../../actions/actions.js'
import { Reducer } from '../base.js'
import { choice, range } from '../../utils.js'
import { STRUCTURE_TYPES, STRUCTURES } from './consts.js'

export class SelectionReducer extends Reducer {
    actions = [
        actions.SELECTION_END,
    ];

    [actions.SELECTION_END] (action) {
        const {tool, selectedTiles} = action;

        if (tool.toolType === 'SINGLE_STRUCTURE') {
            return this.setStructure(tool, selectedTiles);
        } else if (tool.toolType === 'RANGE_OF_STRUCTURES') {
            return this.setStructures(tool, selectedTiles);
        } else if (tool.toolType === 'CLEAR') {
            return this.clearSpace(selectedTiles);
        }
    }

    clearSpace(selectedTiles) {
        this.clearStructures(selectedTiles);
    }

    clearStructures(selectedTiles) {
        for (const {key} of selectedTiles) {
            let structure = this.structures[key];
            if (!structure) {
                continue;
            }
            if (structure.main) {
                structure = this.structures[structure.main];
            }
            for (const [x, y] of this.getStructureTiles(structure)) {
                delete this.structures[`${x}.${y}`];
            }
            if (structure.type === STRUCTURE_TYPES.HOUSE) {
                this.state.population -= structure.data.occupants;
            }
            delete this.state.structuresKeysById[structure.id];
        }
    }

    setStructures(tile, selectedTiles) {
        for (const selectedTile of selectedTiles) {
            this.setStructure(tile, [selectedTile]);
        }
    }

    setStructure({data: {type, ...extraData}}, selectedTiles) {
        const structureType = STRUCTURES[type];
        if (!structureType) {
            console.error("Unknown structure type: ", type);
            return;
        }
        if (structureType.unique && this.structureTypeExists(type)) {
            return;
        }
        const tile = selectedTiles[0];
        const id = this.state.nextStructureId;
        this.state.nextStructureId += 1;

        const structure = {
            id,
            type,
            start: {x: tile.x, y: tile.y},
            end: {
                x: tile.x + structureType.size.width - 1,
                y: tile.y + structureType.size.height - 1,
            },
            key: `${tile.x}.${tile.y}`,
            renderOptions: structureType.renderOptions,
            textRenderOptions: structureType.textRenderOptions,
            getText: structureType.getText,
            structureSize: structureType.size,
            randomValue: choice(range(64)),
        };
        structure.data = (structureType.makeData || (() => null))(
            structure, extraData);

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (this.structures[key]) {
                return;
            }
        }

        for (const [eX, eY] of this.getStructureTiles(structure)) {
            const key = `${eX}.${eY}`;
            if (eX === tile.x && eY === tile.y) {
                this.structures[key] = structure;
            } else {
                this.structures[key] = {main: structure.key, key};
            }
        }

        this.state.structuresKeysById[structure.id] = structure.key;
    }
}
