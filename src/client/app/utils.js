import { connect } from 'react-redux'
import * as actions from './actions/actions.js'

export function connect4(component) {
    return connect((s, oP) => component.mapPropsToState(s, oP), actions)(component);
}

export function range(minOrMax, max) {
    let min = 0;
    if (typeof max === typeof undefined) {
        max = minOrMax;
    } else {
        min = minOrMax;
    }

    const size = max - min;
    let array = Array.from(Array(size).keys());
    if (min) {
        array = array.map(i => i + min);
    }

    return array;
}

export function cartesian(...lists) {
    if (!lists.length) {
        return [];
    }

    if (lists.length === 1) {
        const [list] = lists;
        return list.map(x => x);
    }

    let tuples = [[]];
    while (lists.length) {
        const list = lists.shift();
        tuples = flatten(tuples.map(
            tuple => list.map(
                item => [...tuple, item])));
    }

    return tuples;
}

export function lattice(...rangeDefinitions) {
    const ranges = rangeDefinitions.map(
        rangeDefinition => range(rangeDefinition)
    );
    return cartesian(...ranges);
}

export function zip(...lists) {
    const length = Math.min(...lists.map(list => list.length));
    return range(length).map(i => lists.map(list => list[i]));
}

export function flatten(array) {
    return Array.prototype.concat(...array);
}

export function choice(items) {
    const index = Math.floor(Math.random() * items.length);
    return items[index]
}

export function dict(items) {
    const mapped = {};
    for (const [key, value] of items) {
        mapped[key] = value;
    }

    return mapped;
}

export function toDict(array, valueFunc, keyFunc=key => key) {
    return dict(zip(array.map(keyFunc), array.map(valueFunc)))
}
