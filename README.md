# ReservaLabs · Frontend

Frontend en React + Vite para consultar laboratorios y crear reservas mediante la API de `sistema-reservas-back`.

## Requisitos

- Node.js 18 o superior.
- Backend ejecutándose en `http://localhost:3010`.

## Inicio rápido

```bash
npm install
copy .env.example .env
npm run dev
```

En macOS o Linux, usa `cp .env.example .env`. La variable `VITE_API_URL` permite apuntar a otra dirección sin cambiar el código.

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run lint     # análisis estático
npm run build    # compilación de producción
npm run preview  # vista previa de la compilación
```

## Integración con la API

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/salas` | Lista salas con sus reservas. |
| `POST` | `/api/salas/:id/reservas` | Crea una reserva en una sala. |

El formulario replica las reglas Zod del backend para ofrecer retroalimentación inmediata. El backend sigue siendo la fuente de verdad y valida cada solicitud nuevamente.

## Criterios cubiertos

- Estados de carga, error, lista vacía y reintento.
- Lista responsive de laboratorios y reservas.
- Selección de sala y formulario de reserva accesible.
- Validación de responsable, motivo, fechas, orden temporal y reservas en el pasado.
- Manejo de errores `400`, `404` y errores generales de conexión.
- Recarga automática de los datos tras crear una reserva.
- URL de API configurable y sin secretos versionados.
