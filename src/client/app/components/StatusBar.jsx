import React from 'react';
import { connect4, lattice } from '../utils.js'

class UCStatusBar extends React.Component {
    LABELS = [
        {key: 'date', getText: () => `
            ${this.props.running ? '\u25B6\uFE0F' : '\u23F8\uFE0F'}
            ${this.props.date.day}
            ${this.MONTHS[this.props.date.month]}
            ${Math.abs(this.props.date.year)}
            ${this.props.date.year < 0 ? 'BC' : 'AD'}
        `, onClick: () => this.props.tickToggle()},
        {key: 'population', getText: () => `${this.props.population} people`},
        {key: 'money', getText: () => `${this.props.money} denarii`},
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

    static mapPropsToState(state, ownProps) {
        return {
            date: state.date,
            population: state.population,
            money: state.money,
            ...ownProps,
        };
    }

    render() {
        const x0 = 0, y0 = 0, width = 200, height = 25;
        return <g>
            {this.LABELS.map(({key, getText, onClick}, i) => this.renderLabel({
                x: x0 + (width + 5) * i, y: y0,
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
