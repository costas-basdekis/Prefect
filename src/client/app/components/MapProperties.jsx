import React from 'react';
import { connect4 } from '../utils.js'
import { titleCase } from 'change-case'

class UCMapProperties extends React.Component {
    static mapPropsToState(state, ownProps) {
        return state.properties;
    }

    constructor(props) {
        super(props);
        this.state = {
            width: props.width,
            height: props.height,
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

        return <div>
            {editable('width')}
            {editable('height')}
            <button type="submit" onClick={this.onSave}>Save</button>
        </div>;
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
