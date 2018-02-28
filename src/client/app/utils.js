import { connect } from 'react-redux'
import * as actions from './actions/actions.js'

export function connect4(component) {
    return connect(component.mapPropsToState, actions)(component);
}
