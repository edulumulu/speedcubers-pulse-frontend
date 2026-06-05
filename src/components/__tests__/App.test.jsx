import { render } from '@testing-library/react';
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
    // Logo text is split across spans — check the nav is present
    expect(document.querySelector('nav')).toBeInTheDocument();
  });
});
