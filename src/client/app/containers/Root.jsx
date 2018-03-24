import React from 'react';
import FPSStats from 'react-stats-zavatta'
import { MapProperties } from '../components/MapProperties.jsx';
import { TextureSettings } from '../components/TextureSettings.jsx';
import { Grid } from '../components/Grid.jsx';
import { Terrain } from '../components/Terrain.jsx';
import { Toolbox } from '../components/Toolbox.jsx';
import { StatusBar } from '../components/StatusBar.jsx';
import { Structures } from '../components/Structures.jsx';
import { People } from '../components/People.jsx';
import { connect4, lattice } from '../utils.js'
import { SG2Manager } from '../SG2Manager.js'

const TICK_DURATION = 2000;
const ANIMATION_TICK_DURATION = 250;
const ANIMATION_FRACTION = ANIMATION_TICK_DURATION / TICK_DURATION;

export class UCRoot extends React.Component {
    state = {
        hovered: {x: null, y: null},
        selection: {
            start: {x: null, y: null},
            end: {x: null, y: null},
            type: null,
            size: {width: 1, height: 1},
        },
        tool: {toolType: null, data: null},
        running: true,
        useTextures: false,
        sg2Manager: null,
    };

    static mapStateToProps(state, ownProps) {
        return {
            properties: state.properties,
            ...ownProps,
        }
    }

    componentDidMount() {
        this.tickStart();
    }

    componentWillUnmount() {
        this.tickPause();
    }

    tick = () => {
        this.props.tick();
    }

    animationTick = () => {
        this.props.animationTick(ANIMATION_FRACTION);
    }

    render() {
        return <div>
            <MapProperties />
            <TextureSettings
                useTextures={this.state.useTextures}
                toggleUseTextures={this.toggleUseTextures}
                loadSgFiles={this.loadSgFiles} />
            <br />
            <svg width={900} height={800} style={{
                border: "1px solid black",
            }}>
                <Terrain
                    useTextures={this.state.useTextures}
                    sg2Manager={this.state.sg2Manager} />
                <Structures
                    useTextures={this.state.useTextures}
                    sg2Manager={this.state.sg2Manager} />
                <People />
                <Grid
                    hovered={this.state.hovered}
                    isHovered={this.isHovered}
                    setHovered={this.setHovered}
                    selection={this.state.selection}
                    isSelected={this.isSelected}
                    setSelectionStart={this.setSelectionStart}
                    setSelectionEnd={this.setSelectionEnd}
                    clearSelection={this.clearSelection}/>
                <Toolbox
                    setSelectionType={this.setSelectionType}
                    setSelectionSize={this.setSelectionSize}
                    setTool={this.setTool} />
                <StatusBar
                    running={this.state.running}
                    tickToggle={this.tickToggle}/>
            </svg>
            <FPSStats isActive={true} bottom="auto" left="auto" top="0" right="0" />
        </div>;
    }

    tickToggle = () => {
        if (this.state.running) {
            this.tickPause();
        } else {
            this.tickStart();
        }
    }

    tickStart() {
        this.interval = setInterval(() => this.tick(), TICK_DURATION);
        this.animationInterval = setInterval(() => this.animationTick(), ANIMATION_TICK_DURATION);
        this.setState({running: true});
    }

    tickPause() {
        clearInterval(this.interval);
        this.interval = null;
        clearInterval(this.animationInterval);
        this.animationInterval = null;
        this.setState({running: false});
    }

    isHoveredExact = (x, y) => {
        const {x: hoverX, y: hoverY} = this.state.hovered;
        const isHoveredExact = x === hoverX && y === hoverY;

        return isHoveredExact;
    }

    isHovered = (x, y) => {
        const {x: hoverX, y: hoverY} = this.state.hovered;
        const {width, height} = this.state.selection.size;
        const isHovered1 = (
            (x !== null)
            && (y !== null)
            && (hoverX !== null)
            && (hoverY !== null)
            && (x >= hoverX)
            && (x < (hoverX + width))
            && (y >= hoverY)
            && (y < (hoverY + height))
        );

        return isHovered1;
    }

    setHovered = (x, y) => {
        if (!this.isHoveredExact(x, y)) {
            this.setState(state => ({hovered: {x, y}}));
        }
    }

    setSelectionType = type => {
        this.setState(state => ({selection: {...state.selection, type}}));
    }

    setSelectionSize = (size={width: 1, height: 1}) => {
        this.setState(state => ({selection: {...state.selection, size}}));
    }

    setTool = (toolType, data) => {
        this.setState(state => ({tool: {toolType, data}}));
    }

    getSelectedTiles = () => {
        const {width, height} = this.props.properties;
        const coords = lattice(width, height);
        return coords
            .filter(([x, y]) => this.isSelected(x, y))
            .map(([x, y]) => ({x, y, key: `${x}.${y}`}));
    }

    isSelected = (x, y) => {
        const IS_SELECTED_TYPES = {
            null: this.isSelectedFalse,
            'SQUARE': this.isSelectedSquare,
            'ROAD': this.isSelectedRoad,
            'TILE': this.isSelectedTile,
        };

        return IS_SELECTED_TYPES[this.state.selection.type](x, y);
    }

    isSelectedFalse = (x, y) => {
        return false;
    }

    isSelectedTile = (x, y) => {
        const {start, end, size: {width, height}} = this.state.selection;
        if (start.x === null) {
            return false;
        }
        return (
            x >= end.x
            && x < (end.x + width)
            && y >= end.y
            && y < (end.y + height)
        );
    }

    isSelectedSquare = (x, y) => {
        const {start, end} = this.state.selection;
        if (start.x === null) {
            return false;
        }
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        return (minX <= x) && (x <= maxX) && (minY <= y) && (y <= maxY);
    }

    isSelectedRoad = (x, y) => {
        const {start, end} = this.state.selection;
        if (start.x === null) {
            return false;
        }
        const isRight = end.x >= start.x;
        const isBeneath = end.y >= start.y;
        if (isRight === isBeneath) {
            return this.isSelectedRoadXThenY(x, y);
        } else {
            return this.isSelectedRoadYThenX(x, y);
        }
        return false;
    }

    isSelectedRoadXThenY(x, y) {
        const {start, end} = this.state.selection;
        if (x === start.x) {
            return this.isSelectedRoadX(x, y);
        }
        if (y === end.y) {
            return this.isSelectedRoadY(x, y);
        }
    }

    isSelectedRoadYThenX(x, y) {
        const {start, end} = this.state.selection;
        if (y === start.y) {
            return this.isSelectedRoadY(x, y);
        }
        if (x === end.x) {
            return this.isSelectedRoadX(x, y);
        }
    }

    isSelectedRoadY(x, y) {
        const {start, end} = this.state.selection;
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        return (minX <= x) && (x <= maxX);
    }

    isSelectedRoadX(x, y) {
        const {start, end} = this.state.selection;
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        return (minY <= y) && (y <= maxY);
    }

    setSelectionStart = (x, y) => {
        this.setState(state => ({
            selection: {
                ...state.selection,
                start: {x, y},
                end: {x, y},
            },
        }));
    }

    setSelectionEnd = (x, y) => {
        this.setState(state => ({
            selection: {
                ...state.selection,
                start: state.selection.start,
                end: {x, y},
            },
        }));
    }

    clearSelection = () => {
        this.props.selectionEnd(
            this.state.tool,
            this.getSelectedTiles(),
        );
        this.setState(state => ({
            selection: {
                ...state.selection,
                start: {x: null, y: null},
                end: {x: null, y: null},
            },
        }));
    }

    toggleUseTextures = useTextures =>  {
        this.setState(state => ({
            useTextures,
        }))
    }

    loadSgFiles = ({fileSg2, file555}) => {
        const frSg2 = new FileReader();
        frSg2.onload = () => {
            const fr555 = new FileReader();
            fr555.onload = () => {
                let sg2Manager;
                try {
                    sg2Manager = new SG2Manager(
                        frSg2.result, fileSg2.name, fr555.result, file555.name);
                } catch (e) {
                    alert(`Error while loading texures: ${e}`);
                    return;
                }
                const endTime = new Date(), duration = endTime - startTime;
                alert(
                    `Loaded ${sg2Manager.sg2Reader.images.length} images in `
                    + `${sg2Manager.sg2Reader.bitmaps.length} bitmaps, in `
                    + `${(duration / 1000).toFixed(1)}s`);
                this.setState({sg2Manager});
            }
            try {
                fr555.readAsBinaryString(file555);
            } catch (e) {
                alert(`Error while loading 555: ${e}`);
            }
        };
        const startTime = new Date();
        try {
            frSg2.readAsBinaryString(fileSg2);
        } catch (e) {
            alert(`Error while loading SG2: ${e}`);
        }
    }
}

const Root = connect4(UCRoot);
export default Root;
