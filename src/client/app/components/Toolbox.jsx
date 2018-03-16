import React from 'react';
import { connect4 } from '../utils.js'

function Building(key, label=null, size=null){
    if (label === null) {
        label = key
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/^./, match => match.toUpperCase());
    }
    const tool = {
        label,
        key,
        toolType: "SINGLE_STRUCTURE",
        selectionType: "TILE",
        data: {type: key},
    };

    if (size) {
        tool.selectionSize = size;
    }

    return tool;
}

class UCToolbox extends React.PureComponent {
    TOOLS = [
        {label: "Road", key: "ROAD", selectionType: "ROAD", toolType: "RANGE_OF_STRUCTURES", data: {type: 'ROAD'}},
        {label: "Clear", key: "CLEAR", toolType: "CLEAR", selectionType: "SQUARE"},
        Building("ENTRY"),
        Building("EXIT"),
        {label: "Housing", key: "HOUSE", toolType: "RANGE_OF_STRUCTURES", selectionType: "SQUARE", data: {type: 'HOUSE'}},
        {label: "Water", key: "WATER", children: [
            Building("WELL"),
        ]},
        {label: "Military", key: "MILITARY", children: [
            Building("PREFECTURE"),
        ]},
        {label: "Engineering", key: "ENGINEERING", children: [
            Building("ENGINEERS_POST", "Engineer's Post"),
        ]},
        {label: "Resources", key: "RESOURCES", children: [
            Building("WHEAT_FARM", null, {width: 3, height: 3}),
        ]},
        {label: "Food", key: "FOOD", children: [
            Building("GRANARY", null, {width: 3, height: 3}),
            Building("MARKET", null, {width: 2, height: 2}),
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

    onToolClick = ({key, toolType, selectionType, selectionSize, data, children}) => e => {
        if (this.state.selected === key) {
            this.setState({selected: null});
            this.setSelectionType(null);
            this.setSelectionSize({width: 1, height: 1});
            this.setTool(null, null);
        } else {
            this.setState({selected: key});
            if (!children) {
                this.setSelectionType(selectionType);
                this.setSelectionSize(selectionSize);
                this.setTool(toolType, data);
            }
        }
    }

    setSelectionType(type) {
        this.props.setSelectionType(type);
    }

    setSelectionSize(size) {
        this.props.setSelectionSize(size);
    }

    setTool(toolType, data) {
        this.props.setTool(toolType, data);
    }
}

export const Toolbox = connect4(UCToolbox);
