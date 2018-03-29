import { Reducer } from './base.js'
import { Newcomer } from './people/newcomer.js'
import { Homeless } from './people/homeless.js'
import { WorkerSeeker } from './people/workerSeeker.js'
import { Prefect } from './people/prefect.js'
import { Engineer } from './people/engineer.js'
import { Priest } from './people/priest.js'
import { MarketSeller } from './people/marketSeller.js'
import { MarketBuyer } from './people/marketBuyer.js'
import { CartPusher } from './people/cartPusher.js'

export class PeopleReducer extends Reducer {
    static reducersClasses = [
        Newcomer,
        Homeless,
        WorkerSeeker,
        Prefect,
        Engineer,
        Priest,
        MarketSeller,
        MarketBuyer,
        CartPusher,
    ];

    actions = [];

    initialiseState() {
        Object.assign(this.state, {
            people: {},
            nextPersonId: 1,
            population: 0,
        });
    }
}
