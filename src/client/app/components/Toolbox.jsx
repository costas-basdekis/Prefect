import React from 'react';
import { connect4, lattice } from '../utils.js'
import { TILE_TYPES, GROUND_TYPES } from '../reducers/prefect.js'

class UCToolbox extends React.Component {
    TOOLS = [
        {label: "Road", key: "ROAD", selectionType: "ROAD"},
        {label: "Clear", key: "CLEAR", selectionType: "SQUARE"},
        {label: "Entry", key: "ENTRY", selectionType: "TILE", data: {type: 'ENTRY'}},
        {label: "Exit", key: "EXIT", selectionType: "TILE", data: {type: 'EXIT'}},
    ];

    static mapPropsToState(state, ownProps) {
        return ownProps;
    }

    constructor(props) {
        super(props);
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
                onClick={this.onToolClick(tool)}/>
            <text
                x={x + width / 2} y={y + height / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{pointerEvents: "none"}}>
                {tool.label}
            </text>
        </g>;
    }

    onToolClick = ({key, selectionType, data}) => e => {
        if (this.state.selected === key) {
            this.setState({selected: null});
            this.setSelectionType(null);
            this.setTool(null, null);
        } else {
            this.setState({selected: key});
            this.setSelectionType(selectionType);
            this.setTool(key, data);
        }
    }

    setSelectionType(type) {
        this.props.setSelectionType(type);
    }

    setTool(key, data) {
        this.props.setTool(key, data);
    }
}

export const Toolbox = connect4(UCToolbox);
