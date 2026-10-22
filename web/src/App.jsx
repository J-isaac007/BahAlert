import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router';
import Navbar from './components/ui/Navbar.jsx';
import ProtectedRoute from './components/ui/ProtectedRoute.jsx';
import About from './pages/About.jsx';
import Alerts from './pages/Alerts.jsx';
import Hotlines from './pages/Hotlines.jsx';
import Login from './pages/Login.jsx';
import MapPage from './pages/MapPage.jsx';
import NotFound from './pages/NotFound.jsx';
import SafeZones from './pages/SafeZones.jsx';

// Chart.js and admin code load only when visited
const SensorPage = lazy(() => import('./pages/SensorPage.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

function Layout() {
  return (
    <div className="app">
      <Navbar />
      <Suspense fallback={<p className="page">Loading…</p>}>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<MapPage />} />
        <Route path="sensor/:id" element={<SensorPage />} />
        <Route path="safe-zones" element={<SafeZones />} />
        <Route path="hotlines" element={<Hotlines />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
