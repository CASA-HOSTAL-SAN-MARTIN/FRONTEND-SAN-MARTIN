# 🏠 Casa Estudiantil San Martín — Frontend

Interfaz web del sistema de gestión de la **Casa Estudiantil San Martín**. Permite a administradores, personal y residentes gestionar solicitudes, camas, contratos, pagos, inventarios, mantenimiento, incidentes y visitas desde el navegador.

> Este repositorio contiene **solo el frontend**. Consume la API del repositorio de backend de la misma organización.

---

## 📌 Descripción

La Casa Estudiantil San Martín es una residencia universitaria mixta ubicada en la Carrera 12 # 21-45, barrio Centro de Pereira, para estudiantes de pregrado (principalmente foráneos) vinculada a la Universidad del Otún a través de su oficina de Bienestar Universitario. El inmueble pertenece a la Fundación San Martín de Porres. Cuenta con tres pisos y un sótano de lavado, con **24 habitaciones dobles y 48 camas**. Por reglamento, el piso 1 es para mujeres, el piso 2 para hombres y el piso 3 para casos especiales. Hay 3 cupos de beca de alojamiento pagados por la Universidad.

la operación es manual y fragmentada: **dos listas de Excel que no coinciden** (`Camas_Fundacion.xlsx` y `Espera_Bienestar.xlsx`), solicitudes por Google Forms y WhatsApp, pagos a una cuenta personal, reportes de daños en chats y libretas, y visitas en un cuaderno. Esa falta de una "verdad única" ya causó incidentes, como la **doble asignación de la cama 1-A** (enero de 2026) y disputas por daños que no tenían evidencia fotográfica.

## 🎯 Propósito

- Reemplazar los procesos manuales por una herramienta web simple y rápida.
- Que cada usuario vea solo lo que necesita según su rol.
- Facilitar tareas diarias: asignar una cama, registrar un pago, hacer un inventario, reportar un daño o anotar una visita.
- Dar visibilidad del estado de la casa (camas disponibles, pagos pendientes, reportes abiertos).

## 🧭 Alcance

**Incluye**
- Inicio de sesión y navegación según el rol.
- Registro de solicitudes de ingreso y consulta de la lista de espera.
- Gestión de residentes y acudientes.
- Vista de pisos, habitaciones y camas con su estado (disponible, ocupada, bloqueada) y asignación de camas.
- Contratos, pagos (con carga de comprobante) y becas.
- Inventario de entrada y salida con carga de fotos y firma digital.
- Reportes de mantenimiento con seguimiento de su estado.
- Registro de incidentes y de visitas.
- Reportes y panel con indicadores para administración.

**No incluye**
- Aplicación móvil nativa (la web es responsive).
- Pasarela de pagos en línea.
- Lógica de negocio crítica: las reglas y validaciones finales las aplica el backend.

## 👥 Usuarios y pantallas

| Rol | Responsabilidad principal |
|---|---|
| Administrador del sistema | Crea usuarios, asigna roles y permisos, soporte técnico de primer nivel |
| Coordinación de Bienestar (Patricia Rincón) | Selección de aspirantes, convivencia, becas y reportes |
| Administración de la Fundación (Jorge Medina) | Contratos, cartera y autorización de reparaciones mayores |
| Monitora (Camila Restrepo) | Check-in, check-out, rondas, convivencia e incidentes |
| Técnico de mantenimiento (Álvaro Gómez) | Atiende y actualiza los reportes de daños |
| Portería nocturna (Don Raúl) | Control de acceso y registro de visitas |
| Contabilidad de la Fundación (Yolanda) | Cierre contable de ingresos y egresos |
| Aspirante / Residente | Solicitud de cupo, consulta de su cama, contrato y pagos, reporte de daños |
| Acudiente | Pagador y responsable legal; autoriza la estancia de menores |

## 🛠️ Tecnologías

Definidas en el SRS (RNF-09):

- **Framework:** React + TypeScript
- **Empaquetador:** Vite
- **Enrutamiento:** React Router
- **Peticiones a la API:** Axios
- **Estilos:** Tailwind CSS
- **Formularios y validación:** React Hook Form + Zod

## 🏗️ Estructura del proyecto

```
src/
├── api/            # llamadas al backend
├── auth/           # login, rutas protegidas por rol
├── components/     # componentes reutilizables
├── pages/          # una carpeta por módulo (camas, pagos, inventario...)
├── hooks/
├── types/          # tipos y enums compartidos con el backend
├── utils/
└── main.tsx
```

## 🚀 Instalación y ejecución

**Requisitos:** Node.js 18+ y npm. El backend debe estar corriendo.

```bash
# 1. Clonar el repositorio
git clone <URL-del-repositorio-frontend>
cd <carpeta-del-repositorio>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Ejecutar en desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (por ejemplo `http://localhost:3000`) |

### Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run preview` | Probar la versión compilada |
| `npm run lint` | Revisar el estilo del código |

## 🎨 Criterios de diseño

- Interfaz simple y consistente, pensada para uso diario del personal.
- Diseño responsive (computador, tablet y celular).
- Mensajes claros de error y confirmación.
- Textos en español.

## 🔒 Seguridad

- El token de sesión se envía en cada petición y se elimina al cerrar sesión.
- Las rutas se protegen según el rol del usuario.
- No se guardan contraseñas ni datos sensibles en el navegador.
- Las validaciones del formulario no reemplazan las del backend.

## 🤝 Flujo de trabajo del equipo

- Rama principal: `main` (protegida). Desarrollo en `develop`.
- Cada tarea en una rama propia: `feature/nombre-corto` o `fix/nombre-corto`.
- Commits claros y en presente (por ejemplo: `feat: agrega formulario de pagos`).
- Todo cambio entra a `develop` mediante *Pull Request* revisado por al menos un compañero.

## 👩‍💻 Equipo de Frontend

**Equipo Los Insanidi**

- Vanya Catalina Portilla Sanchez
- Jhonathan Solarte
