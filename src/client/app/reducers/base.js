// import { STRUCTURE_TYPES } from './structures.js'

export class Reducer {
    actions = null;

    constructor(state) {
        this.state = state;
    }

    get ticks() {
        return this.state.date.ticks;
    }

    get people() {
        return this.state.people;
    }

    get peopleList() {
        return Object.values(this.people);
    }

    get structures() {
        return this.state.structures;
    }

    get structuresList() {
        return Object.values(this.structures);
    }

    getStructureById(id) {
        return this.structures[this.state.structuresKeysById[id]];
    }

    getStructuresOfType(type) {
        return this.structuresList
            .filter(structure => structure.type === type);
    }

    getStructuresWithDataProperty(property) {
        return this.structuresList
            .filter(tile => tile.data && (property in tile.data));
    }

    structureTypeExists(structureType) {
        return this.getStructuresOfType(structureType).length > 0;
    }

    getEntry() {
        const entryTile = this.getStructuresOfType("ENTRY")[0];
        if (!entryTile) {
            return {x: 0, y: 0};
        }

        return entryTile.start;
    }

    getExit() {
        const exitTile = this.getStructuresOfType("EXIT")[0];
        if (!exitTile) {
            return {x: this.state.properties.width - 1, y: this.state.properties.height - 1};
        }

        return exitTile.start;
    }

    reduce(state, action) {
        if (this.actions.indexOf(action.type) < 0) {
            return;
        }

        this.state = state;
        return this[action.type](action);
    }

    initialiseState(state) {
        return state;
    }
}
