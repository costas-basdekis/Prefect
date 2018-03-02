import React from 'react';
import { connect4, lattice } from '../utils.js'
import { TILE_TYPES, GROUND_TYPES } from '../reducers/prefect.js'

class UCTerrain extends React.Component {
    size = 20;

    constructor() {
        super();
        this.state = {
            hovered: {x: null, y: null},
        };
    }

    static mapPropsToState(state, ownProps) {
        return {
            terrain: state.terrain,
            properties: state.properties,
            tiles: lattice(state.properties.width,
                state.properties.height).map(([x, y]) => ({
                    x, y,
                    key: `${x}.${y}`,
                    tile: state.terrain[`${x}.${y}`],
                })),
        };
    }

    render() {
        const centerX = this.size * this.props.properties.width / 2;
        const centerY = this.size * this.props.properties.height / 2;
        return <g transform={`
                scale(1 0.8)
                translate(${centerX * Math.sqrt(2) / 3} ${centerY * Math.sqrt(2) / 3})
                rotate(45 ${centerX} ${centerY})
            `}>
            {this.props.tiles.map(tile => this.renderTile(tile))}
        </g>;
    }

    static TILE_TYPE_OPTIONS = {
        [TILE_TYPES.GROUND]: {
            [GROUND_TYPES.GRASS]: {
                stroke: "green",
                fill: "lightgreen",
            },
            [GROUND_TYPES.DESERT]: {
                stroke: "yellow",
                fill: "lightyellow",
            },
            [GROUND_TYPES.TREES]: {
                stroke: "green",
                fill: "darkgreen",
            },
        },
        [TILE_TYPES.WATER]: {
            undefined: {
                stroke: "blue",
                fill: "royalblue",
            },
        },
        [TILE_TYPES.ROCK]: {
            undefined: {
                stroke: "grey",
                fill: "#666",
            },
        },
    }

    renderTile(tile) {
        const tileOptions = UCTerrain.TILE_TYPE_OPTIONS[tile.tile.type] || {};
        const tileSubOptions = tileOptions[tile.tile.subType] || {};
        return this.baseRenderTile({
            ...tile,
            ...tileSubOptions,
        });
    }

    baseRenderTile({x, y, key, stroke="black", fill="black"}) {
        const {x: hoverX, y: hoverY} = this.state.hovered;
        const isHovered = x === hoverX && y === hoverY;
        return <rect
            x={x * this.size} y={y * this.size}
            width={this.size} height={this.size}
            stroke={isHovered ? 'red' : stroke} strokeWidth={isHovered ? 3 : 1}
            fill={fill}
            key={key}
            onMouseLeave={this.onTileHover(null, null)}
            onMouseEnter={this.onTileHover(x, y)}/>
    }

    onTileHover = (x, y) => (e) => {
        this.setState({hovered: {x, y}});
    }
}

export const Terrain = connect4(UCTerrain);
