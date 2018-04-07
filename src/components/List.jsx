import React from 'react';

export class List extends React.PureComponent {
    state = {
        scrollIndex: 0,
        selectedIndex: null,
    };

    render() {
        const {
            x=0, y=0,
            width=120, height=300,
            itemWidth=100, itemHeight=20,
            items=[],
            fill="#eee", stroke="gold", fontSize="8px"
        } = this.props;
        const visibleItemCount = parseInt((height / (itemHeight + 5)).toFixed(0), 10);
        const visibleItems = items
            .map((item, index) => [item, index])
            .slice(this.state.scrollIndex, this.state.scrollIndex + visibleItemCount)
            .map(([item, index], visibleIndex) => [item, index, visibleIndex]);
        return <g>
            <rect
                x={x} y={y}
                width={width} height={height}
                fill={fill} stroke={stroke} />
            <rect
                x={x + width - itemHeight} y={y}
                width={itemHeight} height={itemHeight}
                fill={stroke} stroke={"black"}
                style={{cursor: 'pointer'}}
                onClick={this.moveUp} />
            <text
                x={x + width - itemHeight + itemHeight / 2} y={y + itemHeight / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{pointerEvents: "none", fontSize}}>
                {"^"}
            </text>
            <rect
                x={x + width - itemHeight} y={y + height - itemHeight}
                width={itemHeight} height={itemHeight}
                fill={stroke} stroke={"black"}
                style={{cursor: 'pointer'}}
                onClick={this.moveDown} />
            <text
                x={x + width - itemHeight + itemHeight / 2} y={y + height - itemHeight + itemHeight / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{pointerEvents: "none", fontSize}}>
                {"v"}
            </text>
            {visibleItems.map(([item, index, visibleIndex]) =>
                this.renderItem(
                    item, index, visibleIndex,
                    {x, y, itemWidth, itemHeight, fontSize}))}
        </g>;
    }

    renderItem(
            {key, text},
            index, visibleIndex,
            {x, y, itemWidth, itemHeight, fontSize}) {
        const itemX = x;
        const itemY = y + visibleIndex * (itemHeight + 5);
        return <g key={key}>
            <rect
                x={itemX} y={itemY}
                width={itemWidth} height={itemHeight}
                fill={this.state.selectedIndex === index ? "#eee" : "#444"} stroke="gold"
                style={{cursor: 'pointer'}}
                onClick={this.select} data-index={index} />
            <text
                x={itemX + itemWidth / 2} y={itemY + itemHeight / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{pointerEvents: "none", fontSize}}>
                {text}
            </text>
        </g>;
    }

    select = (e) => {
        const selectedIndex = parseInt(e.target.dataset.index, 10);
        const selectedItem = (this.props.items || [])[selectedIndex];
        this.setState({selectedIndex});
        if (this.props.onSelect) {
            this.props.onSelect(selectedItem, selectedIndex)
        }
    }

    moveUp = () => {
        this.setState(state => {
            if (state.scrollIndex <= 0) {
                return {scrollIndex: 0};
            } else {
                return {scrollIndex: state.scrollIndex - 1};
            }
        });
    }

    moveDown = () => {
        const {
            height=300,
            itemHeight=20,
            items=[],
        } = this.props;
        const visibleItemCount = parseInt((height / (itemHeight + 5)).toFixed(0), 10);
        const invisibleItemCount = items.length - visibleItemCount;

        this.setState(state => {
            if (invisibleItemCount <= 0) {
                return {scrollIndex: 0}
            } else if (state.scrollIndex >= invisibleItemCount) {
                return {scrollIndex: invisibleItemCount};
            } else {
                return {scrollIndex: state.scrollIndex + 1};
            }
        });
    }
}
