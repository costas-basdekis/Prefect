import React from 'react';
import { MapProperties } from '../components/MapProperties.jsx';
import { Terrain } from '../components/Terrain.jsx';
import { Toolbox } from '../components/Toolbox.jsx';

export class Root extends React.Component {
    render() {
        return <div>
            Hello!
            <br />
            <MapProperties />
            <br />
            <svg width={900} height={600} style={{
                border: "1px solid black",
            }}>
                <Terrain />
                <Toolbox />
            </svg>
        </div>;
    }
}

export default Root;
