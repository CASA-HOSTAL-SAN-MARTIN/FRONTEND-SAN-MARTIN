import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../src/api/client';
import { AuthProvider } from '../../src/auth/AuthContext';
import { AUTH_TOKEN_KEY, expireStoredSession } from '../../src/auth/authStorage';
import { ProtectedRoute } from '../../src/auth/ProtectedRoute';
import { MainLayout } from '../../src/layouts/MainLayout';
import { LoginPage } from '../../src/pages/LoginPage';

vi.mock('../../src/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/aspirantes" element={<h1>Panel de administración</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Issue 17: autenticación y acceso por rol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    vi.mocked(apiClient.get).mockResolvedValue({ data: { roles: ['ADMIN_SISTEMA'], activo: true } });
  });

  it('exige documento y contraseña antes de enviar el acceso', async () => {
    renderLogin();
    const documentInput = screen.getByLabelText('Número de documento') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(documentInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('guarda el token en la sesión y dirige al módulo que corresponde al rol', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { access_token: 'jwt-demo' } });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Número de documento'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(await screen.findByRole('heading', { name: 'Panel de administración' })).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', { numeroDocumento: '12345678', password: 'clave-segura' });
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-demo');
  });

  it('presenta un mensaje claro si el servidor rechaza las credenciales', async () => {
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: { status: 401, data: { message: 'Unauthorized' } },
    });
    vi.mocked(apiClient.post).mockRejectedValue(unauthorized);
    renderLogin();
    fireEvent.change(screen.getByLabelText('Número de documento'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Documento o contraseña incorrectos');
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('avisa si el perfil autenticado está inactivo', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { access_token: 'jwt-demo' } });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { roles: ['ADMIN_SISTEMA'], estado: 'INACTIVO' } });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Número de documento'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu cuenta está inactiva');
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('envía a login si la sesión protegida expira', async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, 'jwt-demo');
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <AuthProvider>
          <Routes>
            <Route path="/privado" element={<ProtectedRoute><h1>Contenido privado</h1></ProtectedRoute>} />
            <Route path="/login" element={<h1>Debes iniciar sesión</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Contenido privado' })).toBeInTheDocument();
    act(() => expireStoredSession());
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Debes iniciar sesión' })).toBeInTheDocument());
  });

  it('rechaza una ruta si el rol autenticado no está autorizado', async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, 'jwt-demo');
    render(
      <MemoryRouter initialEntries={['/contratos']}>
        <AuthProvider>
          <Routes>
            <Route path="/contratos" element={<ProtectedRoute roles={['CONTABILIDAD']}><h1>Contratos privados</h1></ProtectedRoute>} />
            <Route path="/panel" element={<h1>Panel según mi rol</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Panel según mi rol' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Contratos privados' })).not.toBeInTheDocument();
  });

  it('cierra la sesión en el servidor, limpia el token y redirige a login', async () => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, 'jwt-demo');
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <AuthProvider>
          <Routes>
            <Route path="/privado" element={<ProtectedRoute><MainLayout><h1>Panel de usuario</h1></MainLayout></ProtectedRoute>} />
            <Route path="/login" element={<h1>Inicia sesión para continuar</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Inicia sesión para continuar' })).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
