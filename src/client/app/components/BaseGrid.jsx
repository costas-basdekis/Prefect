import React from 'react';
import { Symbols } from './Symbols.jsx';
import { createSelector } from 'reselect';
import { connect4, select4, lattice, dict, withKey } from '../utils.js'

const RECT_WIDTH = 20, RECT_HEIGHT = 20;
const TILE_WIDTH = 58, TILE_HEIGHT = 30;
// We want to align the bottom-right edges of the tiles, so we assume that:
//  * any extra height is on the top of the tile
//  * any extra width is on both sides of the tile
export const getTileTransform = (width, height, xCount=1, yCount=1) => [
    // Align the bottom of the tile, with the bottom of a ground tile
    `translate(0 ${TILE_HEIGHT - height})`,
    // Align the bottom-middle of the tile, with the bottom-middle of a ground
    // tile
    `translate(${(TILE_WIDTH - width) / 2} 0)`,
    // Align the center of the tile (as if it was a ground tile), with the
    // center of the square
    `translate(${-TILE_WIDTH / 2 + RECT_WIDTH / 2} ${-TILE_HEIGHT / 2 + RECT_HEIGHT / 2})`,
    // Squash the width, to be the same as the rect diagonal
    `scale(${TILE_HEIGHT / TILE_WIDTH} 1)`,
    // Re-aligh the center of the tile (as if it was a ground tile), with the
    // center of the square
    `translate(${RECT_WIDTH / 2 * (1 - TILE_HEIGHT / TILE_WIDTH)} 0)`,
    // Rotate the tile, to match the square
    `rotate(-45 ${RECT_WIDTH / 2} ${RECT_WIDTH / 2})`,
    // Move to align, according to xCount and yCount
    `translate(${(xCount - 1) * RECT_WIDTH} ${(yCount - 1) * RECT_HEIGHT})`,
].reverse().join("\n");
export const TILE_TRANSFORM = getTileTransform(TILE_WIDTH, TILE_HEIGHT);

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
        const {textures=null, texturesKeys=null} =
            (options.sg2Manager && this.TEXTURES_DEFINITIONS)
                ? options.sg2Manager.loadDefinitions(this.TEXTURES_DEFINITIONS)
                : {};
        return {
            properties: options.properties,
            tiles: this.createTiles(options),
            center: {
                x: this.size * options.properties.width / 2,
                y: this.size * options.properties.height / 2,
            },
            sg2Manager: options.sg2Manager,
            useTextures: options.useTextures,
            textures,
            texturesKeys,
        };
    }

    static createTiles(options) {
        const coordinates = lattice(
            options.properties.width, options.properties.height);
        return coordinates
            .map(([x, y]) => ({
                x, y,
                key: `${x}.${y}`,
            }))
            .map(tile => ({
                ...tile,
                tileOrTiles: this.createTile(options, tile),
            }))
            .map(tile => (tile.tileOrTiles && tile.tileOrTiles.constructor === Array)
                ? tile.tileOrTiles
                : [{...tile, tile: tile.tileOrTiles}])
            .reduce((total, item) => total.concat(item), [])
            .filter(tile =>
                (tile.tile !== null)
                && (typeof tile.tile !== typeof undefined))
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
            <Symbols
                symbolsKey={this.constructor.name}
                sg2Manager={this.props.sg2Manager}
                texturesDefinitions={this.constructor.TEXTURES_DEFINITIONS} />
            <g key="tiles" className="tiles">
                {this.props.tiles
                    .map(tile => [tile, this.getFullTileOptions(tile)])
                    .map(([tile, options]) =>
                        [tile, options, this.getTileOrder(tile, options)])
                    .sort(withKey(([tile, options, order]) => order))
                    .map(([tile, options, order]) => this.renderTile(tile, options))}
            </g>
        </g>;
    }

    getTileOrder(tile, options) {
        return (tile.x + options.structureWidth - 1)
            + (tile.y + options.structureHeight - 1)
            // Large buildings should be rendered before 1-tile buildings, in
            // the same line
            + ((options.structureWidth > 1 || options.structureHeight > 1)
                ? -0.5 : 0);
    }

    getTileOptions(tile) {
        throw new Error("Not implemented");
    }

    getFullTileOptions(tile) {
        const options = this.getTileOptions(tile) || {};
        if (options.useImageTemplate && this.props.texturesKeys) {
            options.useImage = this.props.sg2Manager.getImageReference(
                this.props.texturesKeys, options.useImageTemplate,
                tile.tile.randomValue);
        }

        return options;
    }

    renderTile(tile, options) {
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
        if (!text && (!this.props.useTextures || !this.props.texturesKeys || (!imageOptions && !useImage))) {
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
        } else if (useImage && this.props.texturesKeys) {
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
        const texture = this.props.textures[id];
        const transform = texture.useTransform || "";
        return <use
            href={`#${id}`}
            key={key}
            transform={`translate(${x} ${y}) ${transform}`} />
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
