import React from 'react';
import { MapProperties } from '../components/MapProperties.jsx';
import { Terrain } from '../components/Terrain.jsx';

export class Root extends React.Component {
    render() {
        return <div>
            Hello!
            <br />
            <MapProperties />
            <br />
            <svg width={1000} height={600} style={{
                border: "1px solid black",
            }}>
                <Terrain />
            </svg>
        </div>;
    }
}

export default Root;
