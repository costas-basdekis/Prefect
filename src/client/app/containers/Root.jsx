import React from 'react';
import FPSStats from 'react-stats-zavatta'
import { MapProperties } from '../components/MapProperties.jsx';
import { Grid } from '../components/Grid.jsx';
import { Terrain } from '../components/Terrain.jsx';
import { Toolbox } from '../components/Toolbox.jsx';
import { Roads } from '../components/Roads.jsx';

export class Root extends React.Component {
    state = {
        hovered: {x: null, y: null},
        selection: {start: {x: null, y: null}, end: {x: null, y: null}},
    };

    render() {
        return <div>
            Hello!
            <br />
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
                <Toolbox selection={this.state.selection} />
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

    getSelected = () => {

    }

    isSelected = (x, y) => {
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
                start: {x, y},
                end: {x, y},
            },
        });
    }

    setSelectionEnd = (x, y) => {
        this.setState({
            selection: {
                start: this.state.selection.start,
                end: {x, y},
            },
        });
    }

    clearSelection = () => {
        this.setState({
            selection: {
                start: {x: null, y: null},
                end: {x: null, y: null},
            },
        });
    }
}

export default Root;
