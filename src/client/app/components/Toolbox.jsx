import React from 'react';
import { connect4, lattice } from '../utils.js'
import { TILE_TYPES, GROUND_TYPES } from '../reducers/prefect.js'

class UCToolbox extends React.Component {
    TOOLS = [
        {"label": "Road", "key": "ROAD"},
        {"label": "Clear", "key": "CLEAR"},
    ];

    constructor() {
        super();
        this.state = {
            selected: null,
        };
    }

    render() {
        return <g>
            {this.TOOLS.map((tool, i) => this.renderTool(tool, i))}
        </g>
    }

    renderTool(tool, index) {
        const x = 800, y = index * 30;
        const width = 100, height = 25;
        const isSelected = tool.key === this.state.selected;
        return <g key={tool.key}>
            <rect
                x={x} y={y}
                width={width} height={height}
                fill={isSelected ? "beige" : "#eee"} stroke="gold"
                key={tool.key} style={{cursor: "pointer"}}
                onClick={this.onToolClick(tool.key)}/>
            <text
                x={x + width / 2} y={y + height / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{pointerEvents: "none"}}>
                {tool.label}
            </text>
        </g>;
    }

    onToolClick = key => e => {
        if (this.state.selected === key) {
            this.setState({selected: null});
        } else {
            this.setState({selected: key});
        }
    }
}

export const Toolbox = (UCToolbox);