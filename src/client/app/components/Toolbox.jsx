import React from 'react';
import { connect4 } from '../utils.js'

class UCToolbox extends React.PureComponent {
    TOOLS = [
        {label: "Road", key: "ROAD", selectionType: "ROAD", toolType: "RANGE_OF_STRUCTURES", data: {type: 'ROAD'}},
        {label: "Clear", key: "CLEAR", toolType: "CLEAR", selectionType: "SQUARE"},
        {label: "Entry", key: "ENTRY", toolType: "SINGLE_STRUCTURE", selectionType: "TILE", data: {type: 'ENTRY'}},
        {label: "Exit", key: "EXIT", toolType: "SINGLE_STRUCTURE", selectionType: "TILE", data: {type: 'EXIT'}},
        {label: "Housing", key: "HOUSE", toolType: "RANGE_OF_STRUCTURES", selectionType: "SQUARE", data: {type: 'HOUSE'}},
        {label: "Water", key: "WATER", children: [
            {label: "Well", key: "WELL", toolType: "SINGLE_STRUCTURE", selectionType: "SQUARE", data: {type: 'WELL'}},
        ]},
        {label: "Military", key: "MILITARY", children: [
            {label: "Prefecture", key: "PREFECTURE", toolType: "SINGLE_STRUCTURE", selectionType: "SQUARE", data: {type: 'PREFECTURE'}},
        ]},
    ];

    static mapStateToProps(state, ownProps) {
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

    onToolClick = ({key, toolType, selectionType, data, children}) => e => {
        if (this.state.selected === key) {
            this.setState({selected: null});
            this.setSelectionType(null);
            this.setTool(null, null);
        } else {
            this.setState({selected: key});
            if (!children) {
                this.setSelectionType(selectionType);
                this.setTool(toolType, data);
            }
        }
    }

    setSelectionType(type) {
        this.props.setSelectionType(type);
    }

    setTool(toolType, data) {
        this.props.setTool(toolType, data);
    }
}

export const Toolbox = connect4(UCToolbox);
