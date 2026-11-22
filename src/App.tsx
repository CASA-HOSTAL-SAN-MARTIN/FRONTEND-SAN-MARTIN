import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { CamasPage } from './pages/CamasPage';
import { ContratosPage } from './pages/ContratosPage';
import { PagosPage } from './pages/PagosPage';
import { EstadoCuentaPage } from './pages/EstadoCuentaPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SolicitudesPage />} />
          <Route
            path="/camas"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN_SISTEMA',
                  'COORDINACION_BIENESTAR',
                  'ADMIN_FUNDACION',
                  'MONITORA',
                ]}
              >
                <CamasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contratos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_SISTEMA', 'ADMIN_FUNDACION']}>
                <ContratosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagos"
            element={
              <ProtectedRoute>
                <PagosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estado-cuenta"
            element={
              <ProtectedRoute>
                <EstadoCuentaPage />
              </ProtectedRoute>
            }
          />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
