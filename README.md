<div align="center">
  <h1>🚚 Bran Go - Web Frontend & Control Tower</h1>
  <p><strong>Plataforma Administrativa y Torre de Control Logística en Tiempo Real</strong></p>
</div>

## 📌 Descripción

El Frontend de **Bran Go** es una aplicación web moderna y altamente reactiva diseñada para la gestión integral de la operación logística. Permite la administración de pedidos, gestión de choferes, y cuenta con una **Torre de Control** impulsada por WebSockets y Google Maps para el rastreo de flota en tiempo real.

## 🛠 Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Estado Global**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Gestión de Datos/Caché**: [React Query (TanStack)](https://tanstack.com/query/latest)
- **Formularios**: React Hook Form + Zod
- **Mapas & Geocoding**: Google Maps JS API (Cloud Styling)
- **Tiempo Real**: Socket.io Client
- **Iconografía**: Tabler Icons

## 🚀 Requisitos Previos

- Node.js (v20 o superior)
- `pnpm` (recomendado) o `npm`
- Clave de API de Google Maps con facturación habilitada.

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz basado en el `.env.example` (si existe):

```env
# URL del backend (incluyendo el puerto, ej: http://localhost:3001)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=tu_map_id_aqui

# Token Mock para entorno de desarrollo (opcional)
NEXT_PUBLIC_DEV_MOCK_TOKEN=operator-mock-token
```

## 💻 Instalación y Uso Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 🚢 Despliegue (CI/CD)

El despliegue está automatizado con **GitHub Actions**. Al hacer `push` a la rama `main`:
1. Se construye una imagen Docker (`node:22-alpine`).
2. Se publica en **GitHub Container Registry (GHCR)** con etiqueta de commit SHA.
3. Se conecta por SSH al VPS de producción.
4. Actualiza el archivo `.env` del servidor y despliega los cambios usando `docker compose` sin tiempos de inactividad (Zero Downtime).

Para despliegue manual usando Docker:
```bash
docker build -t brango-frontend .
docker run -p 3000:3000 brango-frontend
```

## 📁 Estructura del Proyecto (FSD)

El proyecto sigue la arquitectura **Feature-Sliced Design (FSD)** para mantener la escalabilidad:

```
src/
├── app/                  # Rutas de Next.js (App Router) y Layouts principales
├── features/             # Módulos principales del negocio
│   ├── choferes/         # Gestión de unidades y conductores
│   ├── pedidos/          # Carga de excel, asignaciones y tabla
│   └── torre-control/    # Websockets y mapa en vivo
├── shared/               # Componentes, utilidades y hooks genéricos
│   ├── api/              # Configuración de Axios
│   ├── components/ui/    # Botones, Tablas, Modales reutilizables
│   └── integrations/     # Google Maps Loader
```
