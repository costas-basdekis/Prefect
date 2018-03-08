import React from 'react';
import { connect4 } from '../utils.js'

class UCToolbox extends React.Component {
    TOOLS = [
        {label: "Road", key: "ROAD", selectionType: "ROAD", data: {type: 'ROAD'}},
        {label: "Clear", key: "CLEAR", selectionType: "SQUARE"},
        {label: "Entry", key: "ENTRY", selectionType: "TILE", data: {type: 'ENTRY'}},
        {label: "Exit", key: "EXIT", selectionType: "TILE", data: {type: 'EXIT'}},
        {label: "Housing", key: "HOUSE", selectionType: "SQUARE", data: {type: 'HOUSE'}},
        {label: "Water", key: "WATER", children: [
            {label: "Well", key: "WELL", selectionType: "SQUARE", data: {type: 'WELL'}},
        ]},
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

    renderTool(tool, index, xIndex=0) {
        const x = 800 - 105 * xIndex, y = index * 30;
        const width = 100, height = 25;
        const isSelected = this.isToolSelected(tool);
        let children = "";
        if (isSelected && tool.children) {
            children = tool.children.map((child, i) =>
                this.renderTool(child, i + index, xIndex + 1));
        }
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
            {children}
        </g>;
    }

    isToolSelected(tool) {
        if (tool.key === this.state.selected) {
            return true;
        }

        if (!tool.children) {
            return false;
        }

        for (const child of tool.children) {
            if (this.isToolSelected(child)) {
                return true;
            }
        }

        return false;
    }

    onToolClick = ({key, selectionType, data, children}) => e => {
        if (this.state.selected === key) {
            this.setState({selected: null});
            this.setSelectionType(null);
            this.setTool(null, null);
        } else {
            this.setState({selected: key});
            if (!children) {
                this.setSelectionType(selectionType);
                this.setTool(key, data);
            }
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
