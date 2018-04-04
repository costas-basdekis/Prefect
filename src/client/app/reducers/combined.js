import { Reducer } from './base.js'

export class CombinedReducer extends Reducer {
    actions = [];
    static reducersClasses = null;

    static asReducer(state) {
        const reducer = new this(state || {});
        return reducer.reduce.bind(reducer);
    }

    constructor(state) {
        super(state);
        this.reducers = this.constructor.reducersClasses.map(_class => new _class(state));
        return this.initialiseState();
    }

    initialiseState() {
        for (const reducer of this.reducers) {
            reducer.initialiseState();
        }
    }

    reduce(state, action) {
        for (const reducer of this.reducers) {
            state = reducer.reduce(state, action) || state;
        }

        return state;
    }
}
