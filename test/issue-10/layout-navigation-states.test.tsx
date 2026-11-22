import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/auth/AuthContext';
import {
  AppLayout,
  ErrorBoundary,
  ErrorMessage,
  Footer,
  LoadingOverlay,
  LoadingSpinner,
  Navbar,
  SkeletonCard,
  SkeletonTable,
} from '../../src/components';
import { NotFoundPage } from '../../src/pages/NotFoundPage';

function renderWithRouter(ui: React.ReactNode, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

// Componente que arroja error para probar ErrorBoundary
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Error simulado en render');
  }
  return <div>Componente Funcionando Correctamente</div>;
}

describe('Estructura Base, Navegación y Estados de Carga y Error (Issue-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Navegación y Barra Global (Navbar)', () => {
    it('renderiza la marca institucional y los enlaces de navegación principales', () => {
      renderWithRouter(<Navbar />);

      expect(screen.getByText('SAN MARTÍN')).toBeInTheDocument();
      expect(screen.getByText('SM')).toBeInTheDocument();

      expect(screen.getByRole('link', { name: /solicitudes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /camas/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /pagos/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /estado de cuenta/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /inicio/i })).toBeInTheDocument();
    });

    it('muestra botón "Iniciar sesión" si el usuario no está autenticado', () => {
      renderWithRouter(<Navbar />);

      expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it('muestra el nombre del usuario, rol y botón para cerrar sesión cuando está autenticado', () => {
      localStorage.setItem('authToken', 'token-valido');
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: 'usr-1',
          nombre: 'Camila Restrepo',
          email: 'camila@casasanmartin.edu.co',
          rol: 'MONITORA',
        }),
      );
      localStorage.setItem('userRole', 'MONITORA');

      renderWithRouter(<Navbar />);

      expect(screen.getByText('Camila Restrepo')).toBeInTheDocument();
      expect(screen.getByText('MONITORA')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
    });

    it('permite abrir y cerrar el menú móvil al interactuar con el botón hamburguesa', () => {
      renderWithRouter(<Navbar />);

      const toggleBtn = screen.getByLabelText(/abrir menú/i);
      expect(toggleBtn).toBeInTheDocument();

      // Abrir menú móvil
      fireEvent.click(toggleBtn);
      expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Menú móvil' })).toBeInTheDocument();

      // Cerrar menú móvil
      fireEvent.click(screen.getByLabelText('Cerrar menú'));
      expect(screen.queryByRole('navigation', { name: 'Menú móvil' })).not.toBeInTheDocument();
    });
  });

  describe('Pie de Página Institucional (Footer)', () => {
    it('renderiza la dirección de Pereira, información de capacidad y derechos reservados', () => {
      renderWithRouter(<Footer />);

      expect(screen.getByText(/Carrera 12 # 21-45, Centro de Pereira/i)).toBeInTheDocument();
      expect(screen.getByText(/48 camas mixtas/i)).toBeInTheDocument();
      expect(screen.getByText(/Fundación San Martín de Porres/i)).toBeInTheDocument();
      expect(screen.getByText(/Todos los derechos reservados/i)).toBeInTheDocument();
    });
  });

  describe('Estructura Base (AppLayout)', () => {
    it('renderiza Navbar, contenido principal en main y Footer', () => {
      renderWithRouter(
        <AppLayout>
          <div data-testid="test-content">Contenido de Prueba en el Layout</div>
        </AppLayout>,
      );

      expect(screen.getByText('SAN MARTÍN')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText(/Carrera 12 # 21-45/i)).toBeInTheDocument();
    });
  });

  describe('Estados de Carga (LoadingSpinner y Skeletons)', () => {
    it('renderiza el spinner de carga con role="status" y texto accesible', () => {
      render(<LoadingSpinner message="Consultando cupos de residencia..." />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(screen.getAllByText('Consultando cupos de residencia...')[0]).toBeInTheDocument();
    });

    it('renderiza esqueletos de carga de tarjetas y tablas', () => {
      render(
        <div>
          <SkeletonCard />
          <SkeletonTable rows={3} cols={4} />
        </div>,
      );

      expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-table')).toBeInTheDocument();
    });

    it('renderiza overlay de carga modal con backdrop', () => {
      render(<LoadingOverlay message="Guardando comprobante..." />);

      expect(screen.getByRole('dialog', { name: 'Guardando comprobante...' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Estados de Error y Resiliencia (ErrorMessage y ErrorBoundary)', () => {
    it('renderiza mensaje de error y ejecuta callback de reintento', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorMessage
          title="Fallo de conexión"
          message="No fue posible conectar con el servidor de la residencia."
          onRetry={handleRetry}
        />,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Fallo de conexión')).toBeInTheDocument();
      expect(
        screen.getByText('No fue posible conectar con el servidor de la residencia.'),
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /reintentar/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('ErrorBoundary captura excepciones de render y muestra pantalla de contingencia', () => {
      // Silenciar temporalmente console.error de React para este test intencional
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MemoryRouter>
          <ErrorBoundary>
            <BuggyComponent shouldThrow={true} />
          </ErrorBoundary>
        </MemoryRouter>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Ha ocurrido un problema inesperado')).toBeInTheDocument();
      expect(screen.getByText('Error simulado en render')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ir al inicio/i })).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('Página 404 (NotFoundPage)', () => {
    it('renderiza mensaje de página no encontrada y enlaces de navegación', () => {
      renderWithRouter(<NotFoundPage />);

      expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
      expect(screen.getByText(/Error 404/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver solicitudes/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /ir al panel principal/i })).toHaveAttribute(
        'href',
        '/inicio',
      );
    });

    it('se muestra al navegar a una ruta inexistente en App', async () => {
      renderWithRouter(
        <Routes>
          <Route path="/" element={<div>Inicio</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>,
        ['/ruta-que-no-existe-en-el-sistema'],
      );

      expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    });
  });
});
