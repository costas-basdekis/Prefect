import ReactDOM from 'react-dom';
import React from 'react';
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import Root from './containers/Root.jsx';
import { MainReducer } from './reducers/main.js'

import registerServiceWorker from './registerServiceWorker';

const store = createStore(MainReducer.asReducer());
const rootEl = document.getElementById('root');

function render() {
    ReactDOM.render(
        <Provider store={store}>
            <Root />
        </Provider>, rootEl);
}

render();
registerServiceWorker();
