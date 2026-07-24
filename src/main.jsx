import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import { injectStore } from './services/api.js';
import { assertNoFrontendSecrets } from './services/runtimeSecurity.js';
import App from './App.jsx';
import './styles/globals.css';

assertNoFrontendSecrets(import.meta.env);
injectStore(store);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
