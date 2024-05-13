import { configureStore, Action, ThunkAction } from '@reduxjs/toolkit';
import { compose } from 'redux';
import { useDispatch } from 'react-redux';
// import logger from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer, { RootState } from './rootReducer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      trace: true,
      traceLimit: 25,
    })
  : compose;

const middleware = process.env.NODE_ENV === 'production' ? [thunk] : [thunk];

const store = configureStore({
  reducer: rootReducer,
  middleware,
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
export type AppThunk = ThunkAction<void, RootState, null, Action<string>>;

export const UseAppDispatch = () => useDispatch<AppDispatch | any>();

export default store;
