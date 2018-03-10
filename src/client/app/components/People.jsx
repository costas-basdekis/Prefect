import React from 'react';
import { connect4 } from '../utils.js'

export class UCPeople extends React.PureComponent {
    static rectSize = 20;
    static size = 7.5;

    constructor(props) {
        super(props);
        this.rectSize = this.constructor.rectSize;
        this.size = this.constructor.size;
    }

    static mapStateToProps(state, ownProps) {
        return {
            properties: state.properties,
            people: state.people,
            center: {
                x: this.rectSize * state.properties.width / 2,
                y: this.rectSize * state.properties.height / 2,
            },
            ...ownProps,
        };
    }

    render() {
        const {x: centerX, y: centerY} =  this.props.center;
        return <g transform={`
                scale(1 0.8)
                translate(${centerX * Math.sqrt(2) / 3} ${centerY * Math.sqrt(2) / 3 + 30})
                rotate(45 ${centerX} ${centerY})
            `}>
            {Object.values(this.props.people).map(person => this.renderPerson(person))}
        </g>;
    }

    getPersonOptions(person) {
        return {
            ...person.renderOptions,
            text: (person.getText ? person.getText(person) : null),
        };
    }

    renderPerson(person) {
        const options = this.getPersonOptions(person) || {};
        return this.baseRenderPerson({
            ...person,
            ...options,
        });
    }

    baseRenderPerson({position: {x, y}, id, stroke="transparent", fill="transparent",
                    strokeWidth=1}) {
        const radius = this.size;
        const circleX = (x + 0.5) * this.rectSize, circleY = (y + 0.5) * this.rectSize;
        const personCircle = this.personCircle({
            x, y, circleX, circleY, radius, id, stroke, fill, strokeWidth});
        const personText = this.personText({
            circleX, circleY, radius, text: `${id}`});
        return <g key={id}>
            {personCircle}
            {personText}
        </g>;
    }

    personCircle({x, y, circleX, circleY, radius, id, stroke, fill, strokeWidth}) {
        return <circle
            cx={circleX} cy={circleY}
            r={radius}
            stroke={stroke} strokeWidth={strokeWidth}
            fill={fill}
            key={id} />;
    }

    personText({circleX, circleY, radius, text}) {
        return <text
            x={circleX} y={circleY}
            textAnchor="middle" dominantBaseline="middle"
            style={{pointerEvents: "none"}}
            fontSize={12}>
            {text}
        </text>;
    }
}

export const People = connect4(UCPeople);

