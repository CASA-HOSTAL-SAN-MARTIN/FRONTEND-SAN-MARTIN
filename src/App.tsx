import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { CamasPage } from './pages/CamasPage';
import { ContratosPage } from './pages/ContratosPage';
import { AspirantesPage } from './pages/AspirantesPage';
import { ListaEsperaPage } from './pages/ListaEsperaPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/solicitar-cupo" element={<SolicitudesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/camas" element={<CamasPage />} />
      <Route path="/contratos" element={<ContratosPage />} />
      <Route path="/aspirantes" element={<AspirantesPage />} />
      <Route path="/lista-espera" element={<ListaEsperaPage />} />
      <Route path="/inicio" element={<HomePage />} />
    </Routes>
  );
}
