import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store/store.js';
import App from '../../App.jsx';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    expect(screen.getByText(/SpeedCubers Pulse/i)).toBeInTheDocument();
  });
});
