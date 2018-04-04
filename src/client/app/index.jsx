import ReactDOM from 'react-dom';
import React from 'react';
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import Root from './containers/Root.jsx';
import { MainReducer } from './reducers/main.js'

const store = createStore(MainReducer.asReducer());
const appEl = document.getElementById('app');

function render() {
    ReactDOM.render(
        <Provider store={store}>
            <Root />
        </Provider>, appEl);
}

render();
store.subscribe(render);
