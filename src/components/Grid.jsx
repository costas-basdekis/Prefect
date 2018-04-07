import { connect4 } from '../utils.js'
import { BaseGrid } from './BaseGrid.jsx'

class UCGrid extends BaseGrid {
    mouseEvents = true;

    static createTile(options, tile) {
        return {x: tile.x, y: tile.y};
    }

    OPTIONS = {
        true: {
            true: {
                stroke: "red",
                strokeWidth: 3,
            },
            false: {
                stroke: "red",
                strokeWidth: 3,
            },
        },
        false: {
            true: {
                stroke: "blue",
                strokeWidth: 3,
            },
        },
    }

    getTileOptions({tile}) {
        const isHovered = this.props.isHovered(tile.x, tile.y);
        const isSelected = this.props.isSelected(tile.x, tile.y);

        const hoveredOptions = this.OPTIONS[isHovered] || {};
        const options = hoveredOptions[isSelected] || {};
        return options;
    }
}

export const Grid = connect4(UCGrid);
