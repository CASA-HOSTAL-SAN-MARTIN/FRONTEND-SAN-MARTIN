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
import { ProtectedRoute } from './auth/ProtectedRoute';
import { roleAccess } from './auth/roleAccess';
import { RoleDashboard } from './pages/RoleDashboard';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { MiSolicitudPage } from './pages/MiSolicitudPage';
import { GestionSolicitudesPage } from './pages/GestionSolicitudesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/solicitar-cupo" element={<SolicitudesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/establecer-contrasena" element={<SetPasswordPage />} />
      <Route path="/mi-solicitud" element={<ProtectedRoute roles={roleAccess.residents}><MainLayout><MiSolicitudPage /></MainLayout></ProtectedRoute>} />
      <Route path="/solicitudes" element={<ProtectedRoute roles={roleAccess.solicitudes}><MainLayout><GestionSolicitudesPage /></MainLayout></ProtectedRoute>} />
      <Route path="/panel" element={<ProtectedRoute><MainLayout><RoleDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/camas" element={<ProtectedRoute roles={roleAccess.beds}><MainLayout><CamasPage /></MainLayout></ProtectedRoute>} />
      <Route path="/contratos" element={<ProtectedRoute roles={roleAccess.contracts}><MainLayout><ContratosPage /></MainLayout></ProtectedRoute>} />
      <Route path="/aspirantes" element={<ProtectedRoute roles={roleAccess.aspirants}><MainLayout><AspirantesPage /></MainLayout></ProtectedRoute>} />
      <Route path="/lista-espera" element={<ProtectedRoute roles={roleAccess.waitlist}><MainLayout><ListaEsperaPage /></MainLayout></ProtectedRoute>} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
