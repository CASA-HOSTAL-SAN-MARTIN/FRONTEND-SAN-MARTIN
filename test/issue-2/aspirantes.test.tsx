import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAspirante, getAspirante, updateAspirante } from '../../src/api/client';
import { AspirantesPage } from '../../src/pages/AspirantesPage';
import type { Aspirante } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  createAspirante: vi.fn(),
  getAspirante: vi.fn(),
  updateAspirante: vi.fn(),
}));

const mockAspiranteMenor: Aspirante = {
  id: 'd9b1c7a4-3fa0-48e2-9b21-123456789abc',
  nombreCompleto: 'Carlos Rodríguez',
  numDoc: 'TI-1098765432',
  programa: 'Tecnología en Desarrollo de Software',
  promedio: 4.5,
  edad: 17,
  esMenorDeEdad: true,
};


function renderPage() {
  return render(
    <MemoryRouter>
      <AspirantesPage />
    </MemoryRouter>,
  );
}

function fillRequiredPersonalData(nombre = 'Carlos Rodríguez', doc = 'TI-1098765432', edad = '17') {
  fireEvent.change(screen.getByLabelText('Nombre completo *'), { target: { value: nombre } });
  fireEvent.change(screen.getByLabelText('Número de documento *'), { target: { value: doc } });
  fireEvent.change(screen.getByLabelText('Edad *'), { target: { value: edad } });
}

function fillRequiredAcademicData(programa = 'Tecnología en Desarrollo de Software', promedio = '4.5') {
  fireEvent.change(screen.getByLabelText('Programa académico *'), { target: { value: programa } });
  fireEvent.change(screen.getByLabelText('Promedio académico acumulado *'), { target: { value: promedio } });
}

describe('Issue 2 - Registro y Edición de Datos del Aspirante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(createAspirante).mockResolvedValue(mockAspiranteMenor);
    vi.mocked(getAspirante).mockResolvedValue(mockAspiranteMenor);
    vi.mocked(updateAspirante).mockResolvedValue({
      ...mockAspiranteMenor,
      nombreCompleto: 'Carlos Rodríguez Actualizado',
      promedio: 4.8,
    });
  });

  it('organiza el formulario en secciones técnicas (personales, académicos, socioeconómicos) y exige campos requeridos', () => {
    renderPage();

    expect(screen.getByText('1. Datos Personales')).toBeInTheDocument();
    expect(screen.getByText('2. Datos Académicos')).toBeInTheDocument();
    expect(screen.getByText('3. Información Socioeconómica')).toBeInTheDocument();

    expect(screen.getByLabelText('Nombre completo *')).toBeRequired();
    expect(screen.getByLabelText('Número de documento *')).toBeRequired();
    expect(screen.getByLabelText('Edad *')).toBeRequired();
    expect(screen.getByLabelText('Programa académico *')).toBeRequired();
    expect(screen.getByLabelText('Promedio académico acumulado *')).toBeRequired();
  });

  it('detecta en tiempo real cuando el aspirante es menor de 18 años y emite la alerta correspondiente', () => {
    renderPage();

    // Iniciar con aspirante de 17 años
    fireEvent.change(screen.getByLabelText('Edad *'), { target: { value: '17' } });

    expect(
      screen.getByText(/Aspirante menor de 18 años detectado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/requieren autorización firmada por su acudiente/i),
    ).toBeInTheDocument();

    // Cambiar a mayor de 18 años
    fireEvent.change(screen.getByLabelText('Edad *'), { target: { value: '19' } });
    expect(screen.getByText(/Mayor de edad \(≥ 18\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Aspirante menor de 18 años detectado/i)).not.toBeInTheDocument();
  });

  it('permite guardar y cargar un borrador parcial usando almacenamiento local', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Nombre completo *'), { target: { value: 'Aspirante Borrador' } });
    fireEvent.change(screen.getByLabelText('Número de documento *'), { target: { value: 'TI-55555' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Borrador guardado localmente/i);
    expect(localStorage.getItem('aspirante_form_draft')).toContain('Aspirante Borrador');

    // Limpiar el campo y recuperarlo mediante "Cargar borrador"
    fireEvent.change(screen.getByLabelText('Nombre completo *'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Cargar borrador/i }));

    expect(screen.getByLabelText('Nombre completo *')).toHaveValue('Aspirante Borrador');
  });

  it('registra un aspirante mediante POST /api/aspirantes y muestra el identificador', async () => {
    renderPage();

    fillRequiredPersonalData('Carlos Rodríguez', 'TI-1098765432', '17');
    fillRequiredAcademicData('Tecnología en Desarrollo de Software', '4.5');

    fireEvent.submit(screen.getByRole('button', { name: 'Registrar aspirante' }).closest('form')!);

    await waitFor(() => {
      expect(createAspirante).toHaveBeenCalledWith({
        nombreCompleto: 'Carlos Rodríguez',
        numDoc: 'TI-1098765432',
        edad: 17,
        programa: 'Tecnología en Desarrollo de Software',
        promedio: 4.5,
      });
    });

    expect(await screen.findByText('¡Aspirante registrado con éxito!')).toBeInTheDocument();
    expect(screen.getByText(mockAspiranteMenor.id)).toBeInTheDocument();
  });

  it('permite consultar un aspirante por identificador, precargar sus datos y realizar una edición controlada con PUT', async () => {
    renderPage();

    // Ir a pestaña de consulta
    fireEvent.click(screen.getByRole('button', { name: /Consultar y editar/i }));
    fireEvent.change(screen.getByLabelText('Identificador del aspirante *'), {
      target: { value: mockAspiranteMenor.id },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Consultar' }).closest('form')!);

    await waitFor(() => expect(getAspirante).toHaveBeenCalledWith(mockAspiranteMenor.id));
    expect(await screen.findByText(mockAspiranteMenor.nombreCompleto)).toBeInTheDocument();

    // Click en Editar información
    fireEvent.click(screen.getByRole('button', { name: /Editar información/i }));

    // Verifica que precarga los datos en el formulario
    expect(screen.getByLabelText('Nombre completo *')).toHaveValue(mockAspiranteMenor.nombreCompleto);
    expect(screen.getByLabelText('Promedio académico acumulado *')).toHaveValue(4.5);

    // Modificar datos y guardar
    fireEvent.change(screen.getByLabelText('Nombre completo *'), {
      target: { value: 'Carlos Rodríguez Actualizado' },
    });
    fireEvent.change(screen.getByLabelText('Promedio académico acumulado *'), {
      target: { value: '4.8' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!);

    await waitFor(() => {
      expect(updateAspirante).toHaveBeenCalledWith(mockAspiranteMenor.id, {
        nombreCompleto: 'Carlos Rodríguez Actualizado',
        numDoc: mockAspiranteMenor.numDoc,
        edad: mockAspiranteMenor.edad,
        programa: mockAspiranteMenor.programa,
        promedio: 4.8,
      });
    });

    expect(
      await screen.findByText('Información del aspirante actualizada correctamente.'),
    ).toBeInTheDocument();
  });

  it('registra en el historial de modificaciones los cambios tras una edición', async () => {
    renderPage();

    // Cargar aspirante en edición
    fireEvent.click(screen.getByRole('button', { name: /Consultar y editar/i }));
    fireEvent.change(screen.getByLabelText('Identificador del aspirante *'), {
      target: { value: mockAspiranteMenor.id },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Consultar' }).closest('form')!);

    await screen.findByText(mockAspiranteMenor.nombreCompleto);
    fireEvent.click(screen.getByRole('button', { name: /Editar información/i }));

    // Cambiar promedio
    fireEvent.change(screen.getByLabelText('Promedio académico acumulado *'), {
      target: { value: '4.8' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!);

    await screen.findByText('Información del aspirante actualizada correctamente.');

    // Verificar pestaña de historial
    const historyTab = screen.getByRole('button', { name: /Historial de cambios/i });
    expect(historyTab).toBeInTheDocument();
    fireEvent.click(historyTab);

    expect(screen.getByText('Promedio académico')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('informa errores de la API de manera clara', async () => {
    vi.mocked(createAspirante).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'El documento ya se encuentra registrado' } },
    });

    renderPage();
    fillRequiredPersonalData();
    fillRequiredAcademicData();

    fireEvent.submit(screen.getByRole('button', { name: 'Registrar aspirante' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El documento ya se encuentra registrado',
    );
  });
});
