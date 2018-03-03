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
                    setHovered={this.setHovered} />
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
}

export default Root;
