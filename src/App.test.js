import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import Root from './containers/Root.jsx';
import { MainReducer } from './reducers/main.js'

it('renders without crashing', () => {
    const store = createStore(MainReducer.asReducer());
    const div = document.createElement('div');
    ReactDOM.render(<Provider store={store}><Root /></Provider>, div);
    ReactDOM.unmountComponentAtNode(div);
});
