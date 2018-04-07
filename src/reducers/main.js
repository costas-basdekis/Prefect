import { CombinedImmutableReducer } from './combinedImmutable.js'
import { StateReducer } from './state.js'
import { TerrainReducer } from './terrain.js'
import { StructuresReducer } from './structures.js'
import { PeopleReducer } from './people.js'
import { WorkerReducer } from './workers.js'
import { TickReducer } from './tick.js'

export class MainReducer extends CombinedImmutableReducer {
    static reducersClasses = [
        StateReducer,
        TerrainReducer,
        StructuresReducer,
        PeopleReducer,
        WorkerReducer,
        TickReducer,
    ];

    onHandlerUpdate(handler, path, action, prop, value) {
        if (['animationFraction', 'x', 'y'].indexOf(prop) >= 0) {
            return;
        }
        console.log(path, action, prop, value);
    }
}
