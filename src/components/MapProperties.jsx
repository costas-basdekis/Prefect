import React from 'react';
import { connect4 } from '../utils.js';
import { titleCase } from 'change-case';

const shouldBeChecked = window.shouldBeChecked;
const saveChecked = window.saveChecked;

class UCMapProperties extends React.Component {
    static mapStateToProps(state, ownProps) {
        return state.properties;
    }

    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
            property: "map_properties",
            visible: shouldBeChecked("map_properties"),
        };
    }

    render() {
        const editable = (attribute, label) => {
            if (!label) {
                label = titleCase(attribute);
            }
            const value = this.state[attribute]
            return <div>
                <label>
                    {label}:
                    <input type="text" value={value} onChange={this.onAttributeEdit(attribute)} />
                </label>
            </div>;
        }

        return [
            <input type="checkbox"
                name={this.state.property}
                id={`check_${this.state.property}`}
                onClick={this.onToggleShow}
                checked={this.state.visible}
                key="checkbox" />,
            <label htmlFor={`check_${this.state.property}`} key="label">
                Show map properties
            </label>,
            <div key="div" className={this.state.visible ? "" : "hidden"}>
                {editable('width')}
                {editable('height')}
                <button type="submit" onClick={this.onSave}>Save</button>
            </div>,
        ];
    }

    onToggleShow = e => {
        this.setState({visible: e.target.checked});
        saveChecked(this.state.property, e.target.checked);
    }

    onSave = e => {
        this.props.resizeTerrain(this.state.width, this.state.height);
    }

    onAttributeEdit = attribute => e => {
        this.setState({
            [attribute]: e.target.value,
        });
    }
}

export const MapProperties = connect4(UCMapProperties);
