import { WorkerWanderer } from './workerWanderer.js'
import { PEOPLE_TYPES, PEOPLE } from './consts.js'

export class MarketSeller extends WorkerWanderer {
    type = PEOPLE_TYPES.MARKET_SELLER;
    wandererKey = 'marketSeller';

    updateAccess() {
        for (const seller of this.getPeopleOfType(this.type)) {
            const houses = this.getNearbyHousesWithPeople(seller.position);
            if (!houses.length) {
                continue;
            }
            const work = this.getStructureById(seller.workId);
            let {has: sellerHas, needs: sellerNeeds} = work.data.reserves;
            for (const house of houses) {
                const {needs, has} = house.data.reserves;
                const willGet = dict(Object.keys(needs)
                    .filter(key => needs[key] > (has[key] || 0))
                    .filter(key => (sellerHas[key] || 0) > 0)
                    .map(key => [key, Math.min(needs[key] - (has[key] || 0), sellerHas[key])])
                );
                if (!Object.keys(willGet).length) {
                    continue;
                }
                Object.assign(work.data.reserves.has,
                    dict(Object.keys(willGet)
                        .map(key => [key, sellerHas[key] - willGet[key]]))
                );
                Object.assign(work.data.reserves.needs,
                    dict(Object.keys(willGet)
                        .map(key => [key, sellerNeeds[key] + willGet[key]]))
                );
                ({has: sellerHas, needs: sellerNeeds} = work.data.reserves);
                Object.assign(house.data.reserves.has,
                    dict(Object.keys(willGet)
                        .map(key => [key, (has[key] || 0) + willGet[key]]))
                );
                Object.assign(house.data.reserves.needs,
                    dict(Object.keys(willGet)
                        .map(key => [key, needs[key] - willGet[key]]))
                );
            }
        }
    }
}
