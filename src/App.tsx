import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { CamasPage } from './pages/CamasPage';
import { ContratosPage } from './pages/ContratosPage';
import { AspirantesPage } from './pages/AspirantesPage';
import { ListaEsperaPage } from './pages/ListaEsperaPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/solicitar-cupo" element={<SolicitudesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/camas" element={<MainLayout><CamasPage /></MainLayout>} />
      <Route path="/contratos" element={<MainLayout><ContratosPage /></MainLayout>} />
      <Route path="/aspirantes" element={<MainLayout><AspirantesPage /></MainLayout>} />
      <Route path="/lista-espera" element={<MainLayout><ListaEsperaPage /></MainLayout>} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
