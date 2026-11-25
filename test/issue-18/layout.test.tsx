import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorAlert } from '../../src/components/ui/ErrorAlert';
import { Spinner } from '../../src/components/ui/Spinner';
import { MainLayout } from '../../src/layouts/MainLayout';

describe('Issue 18: estructura, navegación y estados comunes', () => {
  it('muestra navegación de módulos y marca la ruta activa', () => {
    render(
      <MemoryRouter initialEntries={['/camas']}>
        <MainLayout><h1>Ocupación de camas</h1></MainLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Navegación de módulos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aspirantes' })).toHaveAttribute('href', '/aspirantes');
    expect(screen.getByRole('link', { name: 'Camas' })).toHaveClass('active');
    expect(screen.getByRole('heading', { name: 'Ocupación de camas' })).toBeInTheDocument();
  });

  it('expone un indicador accesible de carga', () => {
    render(<Spinner label="Cargando camas..." />);
    expect(screen.getByRole('status', { name: 'Cargando camas...' })).toBeInTheDocument();
  });

  it('muestra un estado vacío descriptivo', () => {
    render(<EmptyState title="No hay camas" description="No se encontraron registros." />);
    expect(screen.getByRole('heading', { name: 'No hay camas' })).toBeInTheDocument();
    expect(screen.getByText('No se encontraron registros.')).toBeInTheDocument();
  });

  it('permite reintentar después de un error', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="No se pudo conectar." onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar.');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('muestra la página 404 para rutas desconocidas', () => {
    render(
      <MemoryRouter initialEntries={['/ruta-inexistente']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });
});
