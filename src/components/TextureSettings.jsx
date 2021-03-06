import React from 'react';
import { connect4 } from '../utils.js'

const shouldBeChecked = window.shouldBeChecked || (() => false);
const saveChecked = window.saveChecked || (() => undefined);

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
                <button key="load" onClick={this.loadSgFiles} >Load SG2/555</button>
                {this.props.sg2Manager
                    ? <button key="save" onClick={this.saveJsonFiles} >Save JSON</button>
                    : ""}
                <br />
                <label key="fileJson">
                    JSON textures file: <input name="fileJson" type="file" onChange={this.onFileChange} />
                </label>
                <br />
                <button key="loadJson" onClick={this.loadJsonFiles} >Load JSON</button>
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

    saveJsonFiles = () => {
        const json = this.props.sg2Manager.exportJson();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(json).then(() => {
                alert("Copied JSON textures to clipboard");
            }, () => {
                alert(
                    "Failed to copy JSON textures to clipboard, check console");
                console.log("JSON textures:\n", json);
            })
        } else {
            console.log("JSON textures:\n", json);
            alert("Copy to clipboard is disabled, so copied to console");
        }
    }

    loadJsonFiles = () => {
        const {fileJson} = this.state;
        this.props.loadJsonFiles({fileJson});
    }

    onFileChange = e => {
        this.setState({[e.target.name]: e.target.files[0]});
    }
}

export const TextureSettings = connect4(UCTextureSettings);
