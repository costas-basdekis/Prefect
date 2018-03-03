import React from 'react';
import { connect4, lattice } from '../utils.js'

export class BaseGrid extends React.Component {
    size = 20;
    mouseEvents = false;

    static mapPropsToState(state, ownProps) {
        return {
            properties: state.properties,
            tiles: lattice(state.properties.width,
                state.properties.height).map(([x, y]) => ({
                    x, y,
                    key: `${x}.${y}`,
                })).map(tile => ({
                    ...tile,
                    tile: this.createTile(state, ownProps, tile),
                })).filter(tile =>
                    (tile.tile !== null)
                    && (typeof tile.tile !== typeof undefined)),
            ...ownProps,
        };
    }

    static createTile(state, ownProps, tile) {
        return null;
    }

    render() {
        const centerX = this.size * this.props.properties.width / 2;
        const centerY = this.size * this.props.properties.height / 2;
        return <g transform={`
                scale(1 0.8)
                translate(${centerX * Math.sqrt(2) / 3} ${centerY * Math.sqrt(2) / 3})
                rotate(-45 ${centerX} ${centerY})
            `} style={this.mouseEvents ? {} : {pointerEvents: "none"}}>
            {this.props.tiles.map(tile => this.renderTile(tile))}
        </g>;
    }

    getTileOptions(tile) {
        throw new Error("Not implemented");
    }

    renderTile(tile) {
        const options = this.getTileOptions(tile) || {};
        return this.baseRenderTile({
            ...tile,
            ...options,
        });
    }

    baseRenderTile({x, y, key, stroke="transparent", fill="transparent",
                    strokeWidth=1}) {
        return <rect
            x={x * this.size} y={y * this.size}
            width={this.size} height={this.size}
            stroke={stroke} strokeWidth={strokeWidth}
            fill={fill}
            key={key}
            onMouseLeave={this.onTileUnHover(x, y)}
            onMouseEnter={this.onTileHover(x, y)}
            onMouseDown={this.onMouseDown(x, y)}
            onMouseUp={this.onMouseUp(x, y)} />
    }

    onTileHover = (x, y) => (e) => {
        this.setHovered(x, y);
        if (e.buttons === 1) {
            this.setSelectionEnd(x, y);
        }
    }

    onTileUnHover = (x, y) => (e) => {
        this.setHovered(null, null);
    }

    onMouseDown = (x, y) => (e) => {
        if (e.buttons !== 1) {
            return;
        }
        this.setSelectionStart(x, y);
    }

    onMouseUp = (x, y) => (e) => {
        if (e.buttons & 1) {
            return;
        }
        this.clearSelection();
    }

    isHovered(x, y) {
        return this.props.isHovered(x, y);
    }

    setHovered(x, y) {
        this.props.setHovered(x, y);
    }

    isSelected(x, y) {
        return this.props.isSelected(x, y);
    }

    setSelectionStart(x, y) {
        this.props.setSelectionStart(x, y);
    }

    setSelectionEnd(x, y) {
        this.props.setSelectionEnd(x, y);
    }

    clearSelection() {
        this.props.clearSelection();
    }
}
