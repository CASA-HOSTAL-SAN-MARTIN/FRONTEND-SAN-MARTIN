import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { CamasPage } from './pages/CamasPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SolicitudesPage />} />
      <Route path="/camas" element={<CamasPage />} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
