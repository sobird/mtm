/**
 * Store
 *
 * @see https://redux.js.org/usage/configuring-your-store
 *
 * sobird<i@sobird.me> at 2023/05/08 23:11:10 created.
 */

import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';
import logger from './middleware/logger';

const composeWithDevTools = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
// const reducer = combineReducers(reducers);
// const store = createStoreWithMiddleware(reducer);

const store = createStore(combineReducers(reducers), composeWithDevTools(applyMiddleware(thunk, logger)));

export default store;
