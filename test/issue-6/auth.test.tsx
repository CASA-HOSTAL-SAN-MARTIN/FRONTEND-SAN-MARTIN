import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from '../../src/api/client';
import { AuthProvider } from '../../src/auth/AuthContext';
import { ProtectedRoute } from '../../src/auth/ProtectedRoute';
import { LoginPage } from '../../src/pages/LoginPage';

vi.mock('../../src/api/client', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getPerfil: vi.fn(),
}));

function renderWithAuth(ui: React.ReactNode, initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('Inicio de Sesión, Sesión Segura y Rutas Protegidas por Rol (Issue-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza el formulario de inicio de sesión con campos de correo y contraseña', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico institucional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña de acceso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.getByText(/perfiles predefinidos por rol/i)).toBeInTheDocument();
  });

  it('valida campos obligatorios antes de enviar el formulario', async () => {
    renderWithAuth(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: 'Iniciar Sesión' });

    // Intento con campos vacíos
    fireEvent.click(submitBtn);
    expect(await screen.findByRole('alert')).toHaveTextContent(/ingresa tu correo electrónico/i);
    expect(login).not.toHaveBeenCalled();

    // Llenar solo correo
    fireEvent.change(screen.getByLabelText(/correo electrónico institucional/i), {
      target: { value: 'usuario@casasanmartin.edu.co' },
    });
    fireEvent.click(submitBtn);
    expect(await screen.findByRole('alert')).toHaveTextContent(/ingresa tu contraseña/i);
    expect(login).not.toHaveBeenCalled();
  });

  it('inicia sesión exitosamente y guarda la sesión en localStorage', async () => {
    vi.mocked(login).mockResolvedValueOnce({
      token: 'jwt-token-12345',
      user: {
        id: 'usr-01',
        nombre: 'Patricia Rincón',
        email: 'bienestar@casasanmartin.edu.co',
        rol: 'COORDINACION_BIENESTAR',
      },
    });

    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/inicio" element={<div>Panel de Inicio Mock</div>} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico institucional/i), {
      target: { value: 'bienestar@casasanmartin.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña de acceso/i), {
      target: { value: 'Secret123*' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'bienestar@casasanmartin.edu.co',
        password: 'Secret123*',
        rememberMe: false,
      });
      expect(localStorage.getItem('authToken')).toBe('jwt-token-12345');
      expect(localStorage.getItem('userRole')).toBe('COORDINACION_BIENESTAR');
    });

    expect(await screen.findByText('Panel de Inicio Mock')).toBeInTheDocument();
  });

  it('muestra mensaje de alerta si la API rechaza las credenciales', async () => {
    vi.mocked(login).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { message: 'Credenciales inválidas. Verifica tu correo o contraseña.' },
      },
    });

    renderWithAuth(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico institucional/i), {
      target: { value: 'error@casasanmartin.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña de acceso/i), {
      target: { value: 'WrongPass' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(
      await screen.findByText(/credenciales inválidas. verifica tu correo o contraseña/i),
    ).toBeInTheDocument();
  });

  it('permite iniciar sesión instantáneamente con los botones de acceso demo', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/inicio" element={<div>Bienvenido al Panel</div>} />
      </Routes>,
    );

    const contabilidadBtn = screen.getByRole('button', { name: /acceder como yolanda contadora/i });
    fireEvent.click(contabilidadBtn);

    await waitFor(() => {
      expect(localStorage.getItem('userRole')).toBe('CONTABILIDAD');
      expect(localStorage.getItem('authToken')).toContain('jwt-demo-contabilidad');
    });

    expect(await screen.findByText('Bienvenido al Panel')).toBeInTheDocument();
  });

  it('permite alternar la visibilidad de la contraseña', () => {
    renderWithAuth(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText('Ingresa tu contraseña');
    const toggleBtn = screen.getByTitle('Ver contraseña');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('muestra la sesión activa y permite cerrar sesión', async () => {
    localStorage.setItem('authToken', 'token-valido');
    localStorage.setItem(
      'authUser',
      JSON.stringify({
        id: 'usr-test',
        nombre: 'Don Raúl',
        email: 'raul@casasanmartin.edu.co',
        rol: 'PORTERIA',
      }),
    );
    localStorage.setItem('userRole', 'PORTERIA');

    renderWithAuth(<LoginPage />);

    expect(await screen.findByText('Ya has iniciado sesión')).toBeInTheDocument();
    expect(screen.getByText('Don Raúl')).toBeInTheDocument();
    expect(screen.getByText('PORTERIA')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión actual/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('authUser')).toBeNull();
      expect(localStorage.getItem('userRole')).toBeNull();
    });

    expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });

  describe('Rutas Protegidas (ProtectedRoute)', () => {
    it('redirige al login a usuarios no autenticados', async () => {
      renderWithAuth(
        <Routes>
          <Route
            path="/protegido"
            element={
              <ProtectedRoute>
                <div>Contenido Privado</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Página de Login Mock</div>} />
        </Routes>,
        ['/protegido'],
      );

      expect(await screen.findByText('Página de Login Mock')).toBeInTheDocument();
      expect(screen.queryByText('Contenido Privado')).not.toBeInTheDocument();
    });

    it('bloquea a usuarios autenticados cuyo rol no está en allowedRoles mostrando acceso denegado', async () => {
      localStorage.setItem('authToken', 'token-estudiante');
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: 'usr-est',
          nombre: 'Estudiante Residente',
          email: 'estudiante@utp.edu.co',
          rol: 'ASPIRANTE_RESIDENTE',
        }),
      );
      localStorage.setItem('userRole', 'ASPIRANTE_RESIDENTE');

      renderWithAuth(
        <Routes>
          <Route
            path="/contratos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_SISTEMA', 'ADMIN_FUNDACION']}>
                <div>Módulo de Contratos Exclusivo</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        ['/contratos'],
      );

      expect(await screen.findByText('Acceso restringido por rol')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/ASPIRANTE_RESIDENTE/i);
      expect(screen.queryByText('Módulo de Contratos Exclusivo')).not.toBeInTheDocument();
    });

    it('permite el acceso si el usuario autenticado posee uno de los roles permitidos', async () => {
      localStorage.setItem('authToken', 'token-admin');
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: 'usr-admin',
          nombre: 'Jorge Medina',
          email: 'jorge.medina@fundacion.org',
          rol: 'ADMIN_FUNDACION',
        }),
      );
      localStorage.setItem('userRole', 'ADMIN_FUNDACION');

      renderWithAuth(
        <Routes>
          <Route
            path="/contratos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_SISTEMA', 'ADMIN_FUNDACION']}>
                <div>Módulo de Contratos Exclusivo</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        ['/contratos'],
      );

      expect(await screen.findByText('Módulo de Contratos Exclusivo')).toBeInTheDocument();
      expect(screen.queryByText('Acceso restringido por rol')).not.toBeInTheDocument();
    });
  });
});
