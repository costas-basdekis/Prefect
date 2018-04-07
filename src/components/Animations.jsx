import React from 'react';
import { ANIMATIONS_DEFINITIONS } from './People.jsx';
import { List } from './List.jsx';
import { dict } from '../utils.js'

const PEOPLE_ANIMATIONS = ANIMATIONS_DEFINITIONS
    .reduce((total, [filename, item]) => total.concat(item), []);

const PEOPLE_ANIMATIONS_BY_KEY = dict(PEOPLE_ANIMATIONS
    .map(([key, animationCount, directions]) =>
        [key, [animationCount, directions]]));

const ANIMATION_TICK_DURATION = 2000 / 12;

export class Animations extends React.PureComponent {
    state = {
        selectedKey: null,
        selectedDirection: null,
        animationIndex: 0,
        animationCount: 0,
    };

    render() {
        const key = this.state.selectedKey;
        // eslint-disable-next-line no-unused-vars
        const [animationCount, directions] = PEOPLE_ANIMATIONS_BY_KEY[key] || [0, []];
        let animationIndex = this.state.animationIndex;
        let images = [];
        if (key && directions && this.props.sg2Manager) {
            images = directions.map(direction =>
                this.props.sg2Manager.imageCache.get(
                    `${key}.${direction}.${animationIndex}#0`));
        }
        return <g>
            <rect
                x={100} y={100}
                width={700} height={500}
                fill="#eee" stroke="gold" />
            <List key={"key"} x={120} y={120} items={PEOPLE_ANIMATIONS
                .map(([key]) => ({key, text: key}))}
                onSelect={this.onKeySelected} />
            {/*<List key={"direction"} x={250} y={120} items={directions
                .map((direction) => ({key: direction, text: direction}))}
                onSelect={this.onDirectionSelected} />*/}
            {images
                .map((image, index) => [image, index])
                .filter(([image]) => image)
                .map(([image, index]) => <image
                    key={index}
                    xlinkHref={image.href}
                    transform={`
                        translate(0 ${index * image.height})
                        translate(380 120)
                        scale(0.5 0.5)
                    `} />)}
        </g>;
    }

    onKeySelected = ({key}) => {
        const [animationCount] = PEOPLE_ANIMATIONS_BY_KEY[key] || [0, []];
        this.setState({
            selectedKey: key,
            selectedDirection: null,
            animationCount,
        });
        if (key) {
            this.tickStart();
        } else {
            this.tickPause();
        }
    }

    onDirectionSelected = ({key: direction}) => {
        const key = this.state.selectedKey;
        const [animationCount] = PEOPLE_ANIMATIONS_BY_KEY[key] || [0, []];
        this.setState({
            selectedDirection: direction,
            animationIndex: 0,
            animationCount,
        });
        if (direction) {
            this.tickStart();
        } else {
            this.tickPause();
        }
    }

    tick() {
        this.setState(state => ({
            animationIndex: ((state.animationIndex || 0) + 1) % (state.animationCount || 1),
        }));
    }

    tickStart() {
        this.tickPause();
        this.interval = setInterval(() => this.tick(), ANIMATION_TICK_DURATION);
    }

    tickPause() {
        clearInterval(this.interval);
        this.interval = null;
    }
}
