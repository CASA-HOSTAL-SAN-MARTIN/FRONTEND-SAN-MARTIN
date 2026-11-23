import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { CamasPage } from './pages/CamasPage';
import { ContratosPage } from './pages/ContratosPage';
import { AspirantesPage } from './pages/AspirantesPage';
import { ListaEsperaPage } from './pages/ListaEsperaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SolicitudesPage />} />
      <Route path="/camas" element={<CamasPage />} />
      <Route path="/contratos" element={<ContratosPage />} />
      <Route path="/aspirantes" element={<AspirantesPage />} />
      <Route path="/lista-espera" element={<ListaEsperaPage />} />
      <Route path="/inicio" element={<HomePage />} />
    </Routes>
  );
}
