import ReactDOM from 'react-dom';
import React from 'react';
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import Root from './containers/Root.jsx';
import { reducer, initialState } from './reducers/prefect.js'

const store = createStore(reducer, initialState());
const appEl = document.getElementById('app');

function render() {
    ReactDOM.render(
        <Provider store={store}>
            <Root />
        </Provider>, appEl);
}

render();
store.subscribe(render);
