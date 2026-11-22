import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { CamasPage } from './pages/CamasPage';
import { ContratosPage } from './pages/ContratosPage';
import { PagosPage } from './pages/PagosPage';
import { EstadoCuentaPage } from './pages/EstadoCuentaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SolicitudesPage />} />
      <Route path="/camas" element={<CamasPage />} />
      <Route path="/contratos" element={<ContratosPage />} />
      <Route path="/pagos" element={<PagosPage />} />
      <Route path="/estado-cuenta" element={<EstadoCuentaPage />} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
