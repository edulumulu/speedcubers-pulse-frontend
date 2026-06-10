import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/AppRouter.jsx';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

export default function App() {
  return (
    <BrowserRouter future={routerFuture}>
      <AppRouter />
    </BrowserRouter>
  );
}
