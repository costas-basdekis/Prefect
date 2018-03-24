import React from 'react';
import { createSelector } from 'reselect';
import { connect4, select4, lattice, dict } from '../utils.js'

const TILE_WIDTH = 58, TILE_HEIGHT = 30;
export const TILE_TRANSFORM = `
    translate(-12 -4)
    scale(0.55 0.55)
    rotate(-45 ${TILE_WIDTH / 2} ${TILE_HEIGHT / 2})
    scale(1 ${TILE_WIDTH / TILE_HEIGHT})
`;

export class BaseGrid extends React.PureComponent {
    static size = 20;
    mouseEvents = false;
    static selectors = {
        properties: (state, ownProps) => state.properties,
        useTextures: (state, ownProps) => ownProps.useTextures,
        sg2Manager: (state, ownProps) => ownProps.sg2Manager,
    };

    static TEXTURES_DEFINITIONS = null;

    constructor(props) {
        super(props);
        this.size = this.constructor.size;
    }

    static mapStateToProps(options) {
        const texturesByKey = (options.sg2Manager && this.TEXTURES_DEFINITIONS)
            ? Object.assign({}, ...this.TEXTURES_DEFINITIONS
                .map(definition => definition(options.sg2Manager)))
            : null;
        const textures = texturesByKey
            ? Object.assign({}, ...Object.values(texturesByKey))
            : null;
        const texturesKeys = texturesByKey ? dict(Object.entries(texturesByKey)
            .map(([key, items]) => [key, Object.keys(items)])) : null;
        return {
            properties: options.properties,
            tiles: this.createTiles(options),
            center: {
                x: this.size * options.properties.width / 2,
                y: this.size * options.properties.height / 2,
            },
            useTextures: options.useTextures,
            textures,
            texturesKeys,
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
                scale(1 0.517241379)
                translate(${centerX * Math.sqrt(2) / 3} ${centerY * Math.sqrt(2) / 3 + 60})
                rotate(45 ${centerX} ${centerY})
            `} style={this.mouseEvents ? {} : {pointerEvents: "none"}}>
            <g key="symbols" className="symbols">
                {this.props.textures
                    ? Object.entries(this.props.textures)
                        .map(([key, options]) =>
                            <symbol key={key} id={key}>
                                {this.tileImage(options)}
                            </symbol>)
                    : ""}
            </g>
            <g key="tiles" className="tiles">
                {this.props.tiles.map(tile => this.renderTile(tile))}
            </g>
        </g>;
    }

    getTileOptions(tile) {
        throw new Error("Not implemented");
    }

    renderTile(tile) {
        const options = this.getTileOptions(tile) || {};
        if (options.useImageTemplate && this.props.texturesKeys) {
            const texturesKeys = this.props.texturesKeys[
                options.useImageTemplate];
            const index = tile.tile.randomValue % texturesKeys.length;
            options.useImage = texturesKeys[index];
        }
        return this.baseRenderTile({
            ...tile,
            ...options,
        });
    }

    baseRenderTile({x, y, key, stroke="transparent", fill="transparent",
                    structureWidth=1, structureHeight=1,
                    strokeWidth=1, text=null, textOptions={},
                    imageOptions=null, useImage=null}) {
        const rectX = x * this.size, rectY = y * this.size;
        const width = this.size * structureWidth;
        const height = this.size * structureHeight;
        const tileRect = this.tileRect({
            x, y, rectX, rectY, width, height, key, stroke, fill, strokeWidth});
        if (!text && (!this.props.useTextures || !this.props.textures || (!imageOptions && !useImage))) {
            return tileRect;
        }
        let tileText;
        if (text) {
            textOptions = {
                ...textOptions,
                x: rectX,
                y: rectY,
                width,
                height,
                text,
            };
            tileText = this.tileText(textOptions);
        }
        let tileImage;
        if (imageOptions) {
            imageOptions = {
                ...imageOptions,
                x: rectX,
                y: rectY,
                width,
                height,
            };
            tileImage = this.tileImage(imageOptions);
        } else if (useImage && this.props.textures) {
            const useImageOptions = {
                id: useImage,
                x: rectX,
                y: rectY,
                key,
            };
            tileImage = this.tileUseImage(useImageOptions);
        }
        if (tileImage && this.props.useTextures) {
            return tileImage;
        }

        return <g key={key}>
            {tileRect}
            {tileText}
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

    tileUseImage({x, y, id, key}) {
        return <use href={`#${id}`} key={key} x={x} y={y} z={x + y} />
    }

    tileImage({x=0, y=0, href, transform=""}) {
        return <image
            xlinkHref={href}
            transform={`translate(${x} ${y}) ${transform}`}
            z={x + y} />
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
