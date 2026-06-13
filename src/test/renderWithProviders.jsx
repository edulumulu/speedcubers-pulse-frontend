import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice.js';
import presenceReducer from '../store/slices/presenceSlice.js';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

export function renderWithProviders(ui, { preloadedState = {} } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, presence: presenceReducer },
    preloadedState,
  });

  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter future={routerFuture}>{ui}</BrowserRouter>
      </Provider>,
    ),
    store,
  };
}
