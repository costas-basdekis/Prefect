import React from 'react';
import { connect4 } from '../utils.js'

class UCTerrain extends React.Component {
    static mapPropsToState(state, ownProps) {
        return {terrain: state.terrain};
    }

    render() {
        return <g>
        </g>;
    }
}

export const Terrain = connect4(UCTerrain);
