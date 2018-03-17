import React from 'react';
import { connect4, lattice } from '../utils.js'

class UCStatusBar extends React.PureComponent {
    LABELS = [
        {key: 'save', getText: () => "Save", onClick: () => this.props.save(), width: 100},
        {key: 'load', getText: () => "Load", onClick: () => this.props.load(), width: 100},
        {key: 'date', getText: () => `
            ${this.props.running ? '\u25B6\uFE0F' : '\u23F8\uFE0F'}
            ${this.props.date.day}
            ${this.MONTHS[this.props.date.month]}
            ${Math.abs(this.props.date.year)}
            ${this.props.date.year < 0 ? 'BC' : 'AD'}
        `, onClick: () => this.props.tickToggle()},
        {key: 'population', getText: () => `${this.props.population} people`, width: 150},
        {key: 'money', getText: () => `${this.props.money} denarii`, width: 150},
    ];

    MONTHS = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    static mapStateToProps(state, ownProps) {
        return {
            date: state.date,
            population: state.population,
            money: state.money,
            ...ownProps,
        };
    }

    render() {
        const x0 = 0, y0 = 0, height = 25;
        let nextX = 0;
        function addX(width) {
            const x = nextX;
            nextX += width;
            return x;
        }
        return <g>
            {this.LABELS.map(({key, getText, onClick, width=200}, i) => this.renderLabel({
                x: addX(width + 5), y: y0,
                width, height, key, text: getText(),
                onClick,
            }))}
        </g>
    }

    renderLabel({x, y, width, height, key, text, onClick}) {
        return <g key={key}>
            <rect
                x={x} y={y}
                width={width} height={height}
                fill="#eee" stroke="gold"
                style={onClick ? {cursor: 'pointer'} : {}}
                onClick={onClick ? onClick : null}/>
            <text
                x={x + width / 2} y={y + height / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{pointerEvents: "none"}}>
                {text}
            </text>
        </g>;
    }
}

export const StatusBar = connect4(UCStatusBar);
