import React from 'react';
import { connect4 } from '../utils.js'
import { titleCase } from 'change-case'

class UCTextureSettings extends React.Component {
    static mapStateToProps(state, ownProps) {
        return ownProps;
    }

    constructor(props) {
        super(props);
        this.state = {
            property: "textures",
            visible: shouldBeChecked("textures"),
        };
    }

    render() {
        return [
            <input type="checkbox"
                name={this.state.property}
                id={`check_${this.state.property}`}
                onChange={this.onToggleShow}
                checked={this.state.visible}
                key="checkbox" />,
            <label htmlFor={`check_${this.state.property}`} key="label">
                Show texture settings
            </label>,
            <div key="div" className={this.state.visible ? "" : "hidden"}>
                <label key="use_textures">
                    <input type="checkbox"
                        checked={this.props.useTextures}
                        onChange={this.onChangeUseTextres} />Use textures
                </label>
                <br />
                <label key="fileSG2">
                    SG2 file: <input name="fileSg2" type="file" onChange={this.onFileChange} />
                </label>
                <br />
                <label key="file555">
                    555 file: <input name="file555" type="file" onChange={this.onFileChange} />
                </label>
                <br />
                <button key="load" onClick={this.loadSgFiles} >Load</button>
            </div>,
        ];
    }

    onToggleShow = e => {
        this.setState({visible: e.target.checked});
        saveChecked(this.state.property, e.target.checked);
    }

    onChangeUseTextres = e => {
        this.props.toggleUseTextures(e.target.checked);
    }

    loadSgFiles = () => {
        const {fileSg2, file555} = this.state;
        this.props.loadSgFiles({fileSg2, file555});
    }

    onFileChange = e => {
        this.setState({[e.target.name]: e.target.files[0]});
    }
}

export const TextureSettings = connect4(UCTextureSettings);
