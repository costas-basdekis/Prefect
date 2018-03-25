import React from 'react';
import { connect4, select4, lattice, dict, withKey } from '../utils.js'

const NOTHING = {};

export class UCSymbols extends React.PureComponent {
    static selectors = {
        symbolsKey: (state, ownProps) => ownProps.symbolsKey,
        sg2Manager: (state, ownProps) => ownProps.sg2Manager || null,
        texturesDefinitions: (state, ownProps) => ownProps.texturesDefinitions || null,
    };

    static mapStateToProps({symbolsKey, sg2Manager, texturesDefinitions}) {
        if (!sg2Manager || !texturesDefinitions) {
            return NOTHING;
        }
        return sg2Manager.loadDefinitions(texturesDefinitions);
    }

    render() {
        if (!this.props.textures) {
            return "";
        }

        return this.nestInGs(dict(Object.entries(this.props.textures)
            .map(([key, {href, transform}]) => [key,
                <symbol key={key} id={key} className={key}>
                    <image xlinkHref={href} transform={transform} />;
                </symbol>])), "symbols");
    }

    nestInGs(components, topKey) {
        const grouped = this.groupByKeys(components);
        return this.makeGs(grouped, topKey);
    }

    makeGs(level, key) {
        const {items, ...sublevels} = level;
        if (!items) {
            return level;
        }
        return <g key={key} data-key={key}>
            {Object.entries(sublevels)
                .map(([subkey, sublevel]) => this.makeGs(sublevel, subkey))
                .concat(...items)}
        </g>;
    }

    groupByKeys(items) {
        const levels = {items: []};
        for (const [key, item] of Object.entries(items)) {
            const parts = key.split(/(\.|#)/g);
            const dottedParts = [[true, "", []]].concat(parts)
                .reduce(([append, previous, total], item) => append
                    ? [false, null, total.concat(`${previous}${item}`)]
                    : [true, item, total])[2];
            let level = levels;
            for (const part of dottedParts) {
                level[part] = level[part] || {items: []};
                level = level[part];
            }
            level.items.push(item);
        }

        return levels;
    }
}

export const Symbols = connect4(UCSymbols);
