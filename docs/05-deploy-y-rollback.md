# 🚀 Guía Oficial: Deploy y Rollback en BranGo Mobile

Esta es la única fuente de la verdad para el ciclo de vida de la aplicación móvil de BranGo. **Cualquier otro método (como usar los botones de la web de Expo) se considera un parche de emergencia** temporal y NO es el flujo estándar.

---

## 1. El Flujo de Trabajo Dorado (Actualizaciones Diarias)

Para enviar actualizaciones rápidas a los choferes (cambiar un botón, arreglar un texto, modificar lógica en TypeScript) usamos **EAS Update** (Actualización Over-The-Air).

**Regla de Oro:** Todo código que viaja a los choferes **tiene que existir en GitHub primero**.

### Pasos Obligatorios:
1. Guarda todos tus archivos en VS Code.
2. Haz el commit: `git add .` y luego `git commit -m "feat: mi nuevo cambio"`
3. Súbelo a la nube: **`git push`**
4. Dispara la actualización a los celulares:
   ```bash
   npx eas-cli update --branch preview --message "feat: mi nuevo cambio"
   ```
*(Nota: Cambiar `preview` por `production` cuando ya estemos en esa fase).*

---

## 2. 🚨 Protocolo de Emergencia: ROLLBACK 🚨

Si la actualización del paso anterior hizo explotar los celulares de los choferes, **NO ENTRES EN PÁNICO**. Sigue estos pasos exactos para retroceder en el tiempo de forma limpia.

### Fase 1: El Salvavidas Rápido (Opcional pero recomendado si hay caos)
Si los choferes están llamando desesperados y no tienes tiempo de tocar código:
1. Entra a la web: [expo.dev](https://expo.dev)
2. Ve a tu proyecto -> Pestaña **Updates**.
3. Busca la actualización de ayer (la que sí funcionaba).
4. Haz clic en los 3 puntitos y dale a **"Republish"**.
*(Esto salvará los celulares en 1 segundo, pero **tu código en GitHub sigue roto**. Tienes que hacer la Fase 2).*

### Fase 2: El Rollback Definitivo (La forma limpia)
Para que tu código en GitHub vuelva a coincidir con lo que tienen los choferes:
1. En tu terminal local, averigua cuál fue el commit malo usando `git log`.
2. Deshaz ese commit con Git:
   ```bash
   git revert <ID_DEL_COMMIT_MALO>
   ```
3. Guarda el arreglo en la nube: **`git push`**
4. Manda la cura oficial a los celulares:
   ```bash
   npx eas-cli update --branch preview --message "fix: rollback de urgencia"
   ```

---

## 3. ¿Cuándo debo usar `eas build` (Generar APK)?

Solo gastarás tu crédito de compilación (`eas build`) cuando hagas cambios estructurales pesados que no pueden viajar por el aire. Por ejemplo:
- Agregar permisos nuevos (Ubicación de fondo, Bluetooth, Cámara).
- Instalar nuevas librerías Nativas en el `package.json` (que requieran tocar código de Java o Swift).
- Generar el primer instalador para dárselo a un chofer nuevo.

Comando:
```bash
npx eas-cli build -p android --profile preview
```
