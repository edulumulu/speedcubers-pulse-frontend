import { Routes, Route } from 'react-router-dom';

function HomePage() {
  return <h1>SpeedCubers Pulse — coming soon</h1>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
