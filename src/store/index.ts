/**
 * Store
 *
 * sobird<i@sobird.me> at 2023/05/08 23:11:10 created.
 */

import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from 'redux-thunk';

import reducers from './reducers';

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
const reducer = combineReducers(reducers);
const store = createStoreWithMiddleware(reducer);

export default store;
