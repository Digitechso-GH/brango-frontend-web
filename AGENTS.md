# ⚙️ Reglas de Agente para Frontend Web (Bran Go Frontend)

> **REGLA OBLIGATORIA DE RAÍZ**: Antes de cualquier cambio, consulta el archivo principal [`AGENTS.md`](file:///c:/Users/Juan/Desktop/Front/BranGo/AGENTS.md) en la raíz del proyecto y el documento de arquitectura frontend [`docs/04-frontend.md`](file:///c:/Users/Juan/Desktop/Front/BranGo/docs/04-frontend.md).

## Reglas Estrictas para Frontend Web:
1. **Idioma del Código**: Todo el código (variables, funciones, componentes, tipos, interfaces, hooks) DEBE estar escrito en **Inglés**.
   - Queda prohibido el uso de términos en español como `chofer`, `usuarioId`, `latitud`, `longitud`, `origenLat`.
2. **CERO PARCHES y Validación Zod**: 
   - Prohibido el uso de condicionales con `||` para resolver inconsistencias de identificadores de entidad (`order.driverId`, `driver.id`, etc.) en los componentes.
   - Toda respuesta de API consumida en `*.api.ts` debe ser validada obligatoriamente en tiempo de ejecución con `Schema.parse(data)` de Zod.
3. **WebSocket Connection**:
   - `useDriverTrackingSocket.ts` se conecta y se une al room `operator:live`.
   - Mapea y guarda la telemetría GPS indexada únicamente bajo el `driverId` canónico.
4. **Diseño & Aestética**: Interfaz moderna, glassmorphism, responsive, sin librerías externas innecesarias.
5. **No adivinar contratos**: Si ocurre un error, corregir el contrato en el backend (NestJS DTOs), nunca parchar en el frontend.

