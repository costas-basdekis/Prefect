import React from 'react';
import { Symbols } from './Symbols.jsx';
import { PEOPLE_TYPES } from '../reducers/people.js'
import { connect4, range, withKey } from '../utils.js'

const RECT_WIDTH = 20, RECT_HEIGHT = 20;
const TILE_WIDTH = 58, TILE_HEIGHT = 30;
const getPersonTransform = (width, height) => [
    // Undo the layer scale
    `scale(${TILE_HEIGHT / TILE_WIDTH} 1)`,
    // Undo the layer rotation
    `rotate(-45 ${RECT_WIDTH / 2} ${RECT_WIDTH / 2})`,
    // Make the person center, the tile's center
    `translate(${-RECT_WIDTH / 2} ${-RECT_WIDTH / 2})`,
].reverse().join("\n");

function PeopleTextures(key, filename, start) {
    return sg2Manager => sg2Manager.loadRange({
        filename, start, count: 1, key,
    }, ({width, height}) =>  ({useTransform: getPersonTransform(width, height)}))
}

 const DIRECTIONS = [
    "up", "up-right", "right", "right-down",
    "down", "down-left", "left", "left-up",
];

const DIRECTIONS_MAP = [
    [{dx: 0, dy: -1}, "up"],
    [{dx: 1, dy: -1}, "up-right"],
    [{dx: 1, dy: 0}, "right"],
    [{dx: 1, dy: 1}, "right-down"],
    [{dx: 0, dy: 1}, "down"],
    [{dx: -1, dy: 1}, "down-left"],
    [{dx: -1, dy: 0}, "left"],
    [{dx: -1, dy: -1}, "left-up"],
].map(([{dx, dy}, direction]) => [{
    dx: dx / Math.sqrt(dx * dx + dy * dy),
    dy: dy / Math.sqrt(dx * dx + dy * dy),
}, direction]);

function DirectionsTextures(key, filename, start, animationIndex, directions=DIRECTIONS) {
    const methods = directions.map((direction, directionOffset) =>
        PeopleTextures(`${key}.${direction}.${animationIndex}`,
            filename, start + directionOffset));
    return sg2Manager => sg2Manager.loadList(methods);
}

function AnimatedDirectionsTextures(key, filename, start, animationCount=12, directions=DIRECTIONS) {
    const methods = range(animationCount)
        .map(animationIndex =>
            DirectionsTextures(key, filename, start, animationIndex, directions))
        .reduce((total, items) => total.concat(items), []);
    return sg2Manager => sg2Manager.loadList(methods);
}

function ManyAnimatedDirectionsTextures(filename, typesAndCounts) {
    const methods = typesAndCounts
        .map(([key, animationCount=12, directions=DIRECTIONS, start]) =>
            [key, animationCount, directions, start])
        .map(([key, animationCount, directions, start], index, array) =>
            [key, animationCount, directions, typeof start !== typeof undefined ? start
                : array.slice(0, index)
                .map(([key, animationCount, directions]) =>
                    animationCount * directions.length)
                .reduce((total, item) => total + item, 0)])
        .map(([keyOrKeys, animationCount, directions, start]) =>
            (keyOrKeys && keyOrKeys.constructor === Array)
                ? keyOrKeys.map(key => [key, animationCount, directions, start])
                : [[keyOrKeys, animationCount, directions, start]])
        .reduce((total, item) => total.concat(item), [])
        .filter(([key]) => key)
        .map(([key, animationCount, directions, start]) =>
            AnimatedDirectionsTextures(key, filename, start, animationCount, directions));
    return sg2Manager => sg2Manager.loadList(methods);
}

export class UCPeople extends React.PureComponent {
    static rectSize = 20;
    static size = 7.5;

    constructor(props) {
        super(props);
        this.rectSize = this.constructor.rectSize;
        this.size = this.constructor.size;
    }

    static selectors = {
        properties: (state, ownProps) => state.properties,
        people: (state, ownProps) => state.people,
        useTextures: (state, ownProps) => ownProps.useTextures,
        sg2Manager: (state, ownProps) => ownProps.sg2Manager,
    };

    static mapStateToProps(options) {
        const {textures=null, texturesKeys=null} =
            (options.sg2Manager && this.TEXTURES_DEFINITIONS)
                ? options.sg2Manager.loadDefinitions(this.TEXTURES_DEFINITIONS)
                : {};
        return {
            properties: options.properties,
            people: options.people,
            center: {
                x: this.rectSize * options.properties.width / 2,
                y: this.rectSize * options.properties.height / 2,
            },
            sg2Manager: options.sg2Manager,
            useTextures: options.useTextures,
            textures,
            texturesKeys,
        };
    }

    static TEXTURES_DEFINITIONS = [
        ManyAnimatedDirectionsTextures("Citizen01.bmp", [
            [PEOPLE_TYPES.WORKER_SEEKER, 12],
            [`${PEOPLE_TYPES.WORKER_SEEKER}.DYING`, 8, ["main"]],
            ['BATH_WORKER', 12],
            ['BATH_WORKER.DYING', 8, ["main"]],
            [PEOPLE_TYPES.PRIEST, 12],
            [`${PEOPLE_TYPES.PRIEST}.DYING`, 8, ["main"]],
            ['ACTOR', 12],
            ['ACTOR.DYING', 8, ["main"]],
            ['LION_TAMER', 12],
            ['LION_TAMER.DYING', 8, ["main"]],
            ['LION_TAMER.FIGHTING', 12],
            ['TAX_COLECTOR', 12],
            ['TAX_COLECTOR.DYING', 8, ["main"]],
            ['SCHOOL_BOY', 12],
            ['SCHOOL_BOY.DYING', 8, ["main"]],
            [[
                PEOPLE_TYPES.MARKET_SELLER,
                PEOPLE_TYPES.MARKET_BUYER,
            ], 12],
            [[
                `${PEOPLE_TYPES.MARKET_SELLER}.DYING`,
                `${PEOPLE_TYPES.MARKET_BUYER}.DYING`,
            ], 8, ["main"]],
            [PEOPLE_TYPES.CART_PUSHER, 12],
            [`${PEOPLE_TYPES.CART_PUSHER}.DYING}`, 8, ["main"]],
            [PEOPLE_TYPES.NEWCOMER, 12],
            [`${PEOPLE_TYPES.NEWCOMER}.DYING`, 8, ["main"]],
            [PEOPLE_TYPES.ENGINEER, 12],
            [`${PEOPLE_TYPES.ENGINEER}.DYING`, 8, ["main"]],
        ]),
        ManyAnimatedDirectionsTextures("citizen02.BMP", [
            ['GLADIATOR', 12],
            ['GLADIATOR.DYING', 8, ["main"]],
            [null, 94, ["?"]], // Gladiator 2?
            ['GLADIATOR3', 12],
            ['GLADIATOR3.DYING', 8, ["main"]],
            ['GLADIATOR3.FIGHTING', 6],
            ['RIOTER', 12],
            ['RIOTER.DYING', 8, ["main"]],
            ['RIOTER.STANDING', 8, ["main"]],
            ['BARBER', 12],
            ['BARBER.DYING', 8, ["main"]],
            [null, 48, ["?"]], // Riots?
            [PEOPLE_TYPES.PREFECT, 12],
            [`${PEOPLE_TYPES.PREFECT}_FIGHTING`, 6],
            [`${PEOPLE_TYPES.PREFECT}_CARRYING_WATER`, 12],
            [`${PEOPLE_TYPES.PREFECT}_THROWING`, 6],
            [`HOMELESS`, 12],
            [`HOMELESS.DYING`, 8, ["main"]],
        ]),
        // ManyAnimatedDirectionsTextures("citizen03.BMP", [
        //     ['LION', 12],
        //     ['GUARD', 12],
        //     ['GUARD.FIGHTING', 5],
        //     ['GUARD.DYING', 8, ["main"]],
        //     ['JAVELIN', 12],
        //     ['JAVELIN.FIGHTING', 5],
        //     ['JAVELIN.STANDING', 1],
        //     ['JAVELIN.DYING', 8, ["main"]],
        //     ['IMPERIAL.FIGHTING', 6],
        //     ['IMPERIAL', 12],
        //     ['IMPERIAL.STANDING', 1],
        //     ['IMPERIAL.DYING', 8, ["main"]],
        //     ['LEGIONARY', 12],
        //     ['LEGIONARY.FIGHTING', 6],
        //     ['LEGIONARY.STANDING', 1],
        //     ['LEGIONARY.DYING', 8, ["main"]],
        //     ['PATRICIAN', 12],
        //     ['PATRICIAN.DYING', 8, ["main"]],
        //     ['DOCTOR', 12],
        //     ['DOCTOR.DYING', 8, ["main"]],
        //     ['MISSIONARY', 12],
        //     ['MISSIONARY.DYING', 8, ["main"]],
        //     ['LIBRARIAN', 12],
        //     ['LIBRARIAN.DYING', 8, ["main"]],
        // ]),
    ];

    render() {
        const {x: centerX, y: centerY} =  this.props.center;
        return <g transform={`
                scale(1 0.517241379)
                translate(${centerX * Math.sqrt(2) / 3} ${centerY * Math.sqrt(2) / 3 + 60})
                rotate(45 ${centerX} ${centerY})
            `}>
            <Symbols
                symbolsKey={this.constructor.name}
                sg2Manager={this.props.sg2Manager}
                texturesDefinitions={this.constructor.TEXTURES_DEFINITIONS} />
            <g key="people" className="people">
                {Object.values(this.props.people)
                    .map(person => this.renderPerson(person))}
            </g>
        </g>;
    }

    getPersonOptions(person) {
        let useImageTemplate;
        if (this.props.texturesKeys) {
            const direction = this.getDirection(person);
            const key = `${person.type}.${direction}.0`;
            if (key in this.props.texturesKeys) {
                useImageTemplate = key;
            }
        }
        return {
            ...person.renderOptions,
            text: (person.getText ? person.getText(person) : null),
            textOptions: person.textRenderOptions || {},
            useImageTemplate,
        };
    }

    getDirection(person, _default="down") {
        let delta;
        if (person.direction) {
            delta = person.direction;
        } else if (person.currentPosition && person.nextPosition) {
            delta = {
                dx: person.nextPosition.x - person.currentPosition.x,
                dy: person.nextPosition.y - person.currentPosition.y,
            };
        } else if (person.position && person.nextPosition) {
            delta = {
                dx: person.nextPosition.x - person.position.x,
                dy: person.nextPosition.y - person.position.y,
            };
        }
        if (!delta) {
            return _default;
        }
        delta = {
            dx: delta.dx / Math.sqrt(delta.dx * delta.dx + delta.dy * delta.dy),
            dy: delta.dy / Math.sqrt(delta.dx * delta.dx + delta.dy * delta.dy),
        };
        const orderedDirectionsMap = DIRECTIONS_MAP
            .map(([mappedDelta, direction]) => [{
                x: mappedDelta.dx - delta.dx,
                y: mappedDelta.dy - delta.dy,
            }, direction])
            .map(([{x, y}, direction]) => [Math.sqrt(x * x + y * y), direction])
            .sort(withKey(([distance, direction]) => distance));
        const [distance, direction] = orderedDirectionsMap[0];
        return direction;
    }

    renderPerson(person) {
        const options = this.getPersonOptions(person) || {};
        if (options.useImageTemplate && this.props.texturesKeys) {
            options.useImage = this.props.sg2Manager.getImageReference(
                this.props.texturesKeys, options.useImageTemplate,
                person.randomValue);
        }
        return this.baseRenderPerson({
            ...person,
            ...options,
        });
    }

    baseRenderPerson({position: {x, y}, id, stroke="transparent", fill="transparent",
                    strokeWidth=1, textOptions={}, useImage}) {
        if (useImage && this.props.useTextures) {
            return <g key={id}>
                {this.tileUseImage({
                    x: x * this.rectSize,
                    y: y * this.rectSize,
                    id: useImage,
                    key: id,
                })}
            </g>;
        }
        const radius = this.size;
        const circleX = (x + 0.5) * this.rectSize, circleY = (y + 0.5) * this.rectSize;
        const personCircle = this.personCircle({
            x, y, circleX, circleY, radius, id, stroke, fill, strokeWidth});
        textOptions = {
            ...textOptions,
            circleX, circleY, radius, text: `${id}`,
        };
        const personText = this.personText(textOptions);
        return <g key={id}>
            {personCircle}
            {personText}
        </g>;
    }

    tileUseImage({x, y, id, key}) {
        const texture = this.props.textures[id];
        const transform = texture.useTransform || "";
        return <use
            href={`#${id}`}
            key={key}
            transform={`translate(${x} ${y}) ${transform}`} />
    }

    tileImage({x=0, y=0, href, transform=""}) {
        return <image
            xlinkHref={href}
            transform={`translate(${x} ${y}) ${transform}`}
            z={x + y} />
    }

    personCircle({x, y, circleX, circleY, radius, id, stroke, fill, strokeWidth}) {
        return <circle
            cx={circleX} cy={circleY}
            r={radius}
            stroke={stroke} strokeWidth={strokeWidth}
            fill={fill}
            key={id} />;
    }

    personText({circleX, circleY, radius, text, stroke="default", fill="default"}) {
        return <text
            x={circleX} y={circleY}
            stroke={stroke} fill={fill}
            textAnchor="middle" dominantBaseline="middle"
            style={{pointerEvents: "none"}}
            fontSize={12}>
            {text}
        </text>;
    }
}

export const People = connect4(UCPeople);

