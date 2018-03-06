export class Reducer {
    static actions = null;

    static reduce(state, action) {
        if (this.actions.indexOf(action.type) < 0) {
            return state;
        }

        return this[action.type](state, action);
    }

    static initialiseState(state) {
        return state;
    }
}
