import React from 'react';
import FPSStats from 'react-stats-zavatta'
import { MapProperties } from '../components/MapProperties.jsx';
import { Grid } from '../components/Grid.jsx';
import { Terrain } from '../components/Terrain.jsx';
import { Toolbox } from '../components/Toolbox.jsx';
import { Roads } from '../components/Roads.jsx';
import { connect4, lattice } from '../utils.js'

export class UCRoot extends React.Component {
    state = {
        hovered: {x: null, y: null},
        selection: {
            start: {x: null, y: null},
            end: {x: null, y: null},
            type: null,
        },
        toolKey: null,
    };

    static mapPropsToState(state, ownProps) {
        return {
            properties: state.properties,
            ...ownProps,
        }
    }

    render() {
        return <div>
            <MapProperties />
            <br />
            <svg width={900} height={600} style={{
                border: "1px solid black",
            }}>
                <Terrain />
                <Roads />
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
                    setToolKey={this.setToolKey} />
            </svg>
            <FPSStats isActive={true} bottom="auto" left="auto" top="0" right="0" />
        </div>;
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

    setToolKey = key => {
        this.setState({toolKey: key});
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
        };

        return IS_SELECTED_TYPES[this.state.selection.type](x, y);
    }

    isSelectedFalse = (x, y) => {
        return false;
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
        if (y === start.y) {
            const minX = Math.min(start.x, end.x);
            const maxX = Math.max(start.x, end.x);
            return (minX <= x) && (x <= maxX);
        }
        if (x === end.x) {
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);
            return (minY <= y) && (y <= maxY);
        }
        return false;
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
            this.state.toolKey,
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
