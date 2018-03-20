import React from 'react';
import { connect4, lattice } from '../utils.js'

class UCStatusBar extends React.PureComponent {
    LABELS = [
        {key: 'save', getText: () => "Save", onClick: () => this.props.save(), width: 75},
        {key: 'load', getText: () => "Load", onClick: () => this.props.load(), width: 75},
        {key: 'date', getText: () => `
            ${this.props.running ? '\u25B6\uFE0F' : '\u23F8\uFE0F'}
            ${this.props.date.day}
            ${this.MONTHS[this.props.date.month]}
            ${Math.abs(this.props.date.year)}
            ${this.props.date.year < 0 ? 'BC' : 'AD'}
        `, onClick: () => this.props.tickToggle()},
        {key: 'population', getText: () => `${this.props.population} people`, width: 100},
        {key: 'workers', getText: () => (
            this.props.workers === 0
            ? `${this.props.allocatedWorkers}a/${this.props.workers}w`
            : this.props.neededWorkers <= this.props.workers
                ? `${this.props.allocatedWorkers}a/${this.props.workers}w [+${this.props.workers - this.props.allocatedWorkers}/+${(100 - 100 * this.props.allocatedWorkers / this.props.workers).toFixed()}%]`
                : `${this.props.allocatedWorkers}a/${this.props.workers}w/${this.props.neededWorkers}n [-${this.props.neededWorkers - this.props.workers}/-${(100 * this.props.neededWorkers / this.props.workers - 100).toFixed()}%]`
        ), width: 200},
        {key: 'money', getText: () => `${this.props.money} denarii`, width: 100},
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

    static selectors = {
        date: (state, ownProps) => state.date,
        population: (state, ownProps) => state.population,
        money: (state, ownProps) => state.money,
        workers: (state, ownProps) => state.workers,
        allocatedWorkers: (state, ownProps) => state.allocatedWorkers,
        neededWorkers: (state, ownProps) => state.neededWorkers,
    };

    static mapStateToProps(selected) {
        return selected;
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
