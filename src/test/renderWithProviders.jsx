import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice.js';
import userReducer from '../store/slices/userSlice.js';

export function renderWithProviders(ui, { preloadedState = {} } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, user: userReducer },
    preloadedState,
  });

  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>{ui}</BrowserRouter>
      </Provider>,
    ),
    store,
  };
}
