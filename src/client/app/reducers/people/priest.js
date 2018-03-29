import { WorkerWanderer } from './workerWanderer.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'

export class Priest extends WorkerWanderer {
    type = PEOPLE_TYPES.PRIEST;
    wandererKey = 'priest';

    createPerson(work, position, direction) {
        const wanderer = super.createPerson(work, position, direction);

        wanderer.dedicatedTo = work.data.dedicatedTo;

        return wanderer;
    }

    updateAccess() {
        for (const priest of this.getPeopleOfType(this.type)) {
            const houses = this.getNearbyHousesWithPeople(priest.position);
            if (!houses.length) {
                continue;
            }
            const {dedicatedTo, accessDuration} = priest;
            const until = this.ticks + accessDuration;
            for (const house of houses) {
                const {religiousAccess} = house.data;
                if ((religiousAccess[dedicatedTo] || 0) >= until) {
                    continue;
                }
                house.data.religiousAccess[dedicatedTo] = until;
            }
        }
    }
}
