import React from 'react';
import { createSelector } from 'reselect';
import { connect4, select4, lattice } from '../utils.js'

export class BaseGrid extends React.PureComponent {
    static size = 20;
    mouseEvents = false;
    static selectors = {
        properties: (state, ownProps) => state.properties,
    };

    constructor(props) {
        super(props);
        this.size = this.constructor.size;
    }

    static mapStateToProps(options) {
        return {
            properties: options.properties,
            tiles: this.createTiles(options),
            center: {
                x: this.size * options.properties.width / 2,
                y: this.size * options.properties.height / 2,
            },
        };
    }

    static createTiles(options) {
        return lattice(options.properties.width,
            options.properties.height).map(([x, y]) => ({
                x, y,
                key: `${x}.${y}`,
            })).map(tile => ({
                ...tile,
                tile: this.createTile(options, tile),
            })).filter(tile =>
                (tile.tile !== null)
                && (typeof tile.tile !== typeof undefined));
    }

    static createTile(options, tile) {
        return null;
    }

    render() {
        const {x: centerX, y: centerY} =  this.props.center;
        return <g transform={`
                scale(1 0.8)
                translate(${centerX * Math.sqrt(2) / 3} ${centerY * Math.sqrt(2) / 3 + 30})
                rotate(45 ${centerX} ${centerY})
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
                    structureWidth=1, structureHeight=1,
                    strokeWidth=1, text=null, textOptions={}}) {
        const rectX = x * this.size, rectY = y * this.size;
        const width = this.size * structureWidth;
        const height = this.size * structureHeight;
        const tileRect = this.tileRect({
            x, y, rectX, rectY, width, height, key, stroke, fill, strokeWidth});
        if (!text) {
            return tileRect;
        }
        textOptions = {
            ...textOptions,
            x: rectX,
            y: rectY,
            width,
            height,
            text,
        };
        return <g key={key}>
            {tileRect}
            {this.tileText(textOptions)}
        </g>;
    }

    tileRect({x, y, rectX, rectY, width, height, key, stroke, fill, strokeWidth}) {
        return <rect
            x={rectX} y={rectY}
            width={width} height={height}
            stroke={stroke} strokeWidth={strokeWidth}
            fill={fill}
            key={key}
            onMouseLeave={this.onTileUnHover(x, y)}
            onMouseEnter={this.onTileHover(x, y)}
            onMouseDown={this.onMouseDown(x, y)}
            onMouseUp={this.onMouseUp(x, y)} />
    }

    tileText({x, y, width, height, text, stroke="default", fill="default"}) {
        const centerX = x + width / 2, centerY = y + height / 2;
        const lines = text.split("\n");
        return <text
            x={centerX} y={lines.length > 1 ? y : centerY}
            stroke={stroke} fill={fill}
            textAnchor="middle" dominantBaseline="middle"
            style={{pointerEvents: "none"}}
            /*transform={`rotate(-45 ${centerX} ${centerY})`}*/
            fontSize={12}>
            {lines.map((line, i) =>
                <tspan x={centerX} dy={i ? "1.2em" : 0} key={i}>
                    {line.trim()}
                </tspan>
            )}
        </text>;
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
