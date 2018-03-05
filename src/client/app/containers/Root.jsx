import React from 'react';
import FPSStats from 'react-stats-zavatta'
import { MapProperties } from '../components/MapProperties.jsx';
import { Grid } from '../components/Grid.jsx';
import { Terrain } from '../components/Terrain.jsx';
import { Toolbox } from '../components/Toolbox.jsx';
import { StatusBar } from '../components/StatusBar.jsx';
import { Structures } from '../components/Structures.jsx';
import { connect4, lattice } from '../utils.js'

export class UCRoot extends React.Component {
    state = {
        hovered: {x: null, y: null},
        selection: {
            start: {x: null, y: null},
            end: {x: null, y: null},
            type: null,
        },
        tool: {tool: null, data: null},
        running: true,
    };

    static mapPropsToState(state, ownProps) {
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

    render() {
        return <div>
            <MapProperties />
            <br />
            <svg width={900} height={800} style={{
                border: "1px solid black",
            }}>
                <Terrain />
                <Structures />
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
        this.interval = setInterval(() => this.tick(), 2000);
        this.setState({running: true});
    }

    tickPause() {
        clearInterval(this.interval);
        this.interval = null;
        this.setState({running: false});
    }

    isHovered = (x, y) => {
        const {x: hoverX, y: hoverY} = this.state.hovered;
        const isHovered = x === hoverX && y === hoverY;

        return isHovered;
    }

    setHovered = (x, y) => {
        if (!this.isHovered(x, y)) {
            this.setState({hovered: {x, y}});
        }
    }

    setSelectionType = type => {
        this.setState({selection: {...this.state.selection, type}});
    }

    setTool = (key, data) => {
        this.setState({tool: {key, data}});
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
        const {start, end} = this.state.selection;
        if (start.x === null) {
            return false;
        }
        return (x === end.x) && (y === end.y);
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
        this.setState({
            selection: {
                ...this.state.selection,
                start: {x, y},
                end: {x, y},
            },
        });
    }

    setSelectionEnd = (x, y) => {
        this.setState({
            selection: {
                ...this.state.selection,
                start: this.state.selection.start,
                end: {x, y},
            },
        });
    }

    clearSelection = () => {
        this.props.selectionEnd(
            this.state.tool,
            this.getSelectedTiles(),
        );
        this.setState({
            selection: {
                ...this.state.selection,
                start: {x: null, y: null},
                end: {x: null, y: null},
            },
        });
    }
}

const Root = connect4(UCRoot);
export default Root;
