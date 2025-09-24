# TraceLog Playground - Testing con API Real

Demo playground que se conecta directamente a la API de TraceLog para testing y desarrollo.

## Características

1. **Conexión API Real** - Se conecta a `localhost:3002` (tracelog-middleware)
2. **Monitor Minimalista** - Visualización simple de eventos capturados
3. **Testing Realista** - Simula escenarios reales sin mocks

## Inicio Rápido

### 1. Levantar API Local

```bash
# En tracelog-middleware
npm run start:dev
# API corriendo en http://localhost:3002
```

### 2. Levantar Playground

```bash
# En tracelog-lib
npm run playground:dev
# Playground en http://localhost:3001
```

### 3. Abrir Browser

Abre http://localhost:3001

## Configuración

### TraceLog Init

```javascript
await TraceLog.init({
  id: 'localhost:3002',
});
```

**Qué hace esto:**
- **API URL Base**: Detecta `localhost:` prefix → genera `http://localhost:3002`
- **Config URL**: `http://localhost:3002/config`
- **Events URL**: `http://localhost:3002/collect`
- **Modo Debug**: Activado automáticamente
- **Headers**: Incluye `X-TraceLog-Project: localhost:3002`

> **Nota técnica**: Los IDs que empiezan con `localhost:` NO usan `getApiUrl()` (que construiría URLs como `https://id.domain.com`). En su lugar, se convierten directamente a `http://localhost:PORT`.

### Allowed Origins

El puerto `3002` está en la lista de orígenes permitidos:
- `http://localhost:3002`
- `http://127.0.0.1:3002`

## Monitor de Eventos

### Vista del Monitor

```
┌─────────────────────────────────┐
│ TraceLog Monitor        Limpiar │
├─────────────────────────────────┤
│ Cola: 3                      ▶️ │
├─────────────────────────────────┤
│ [CLICK]              ✓          │
│ [PAGE_VIEW]          ✓          │
│ [SCROLL]             ⏳         │
└─────────────────────────────────┘
```

### Estados del Monitor

- **▶️** - Cola procesándose normalmente
- **✓** - Evento enviado correctamente
- **⏳** - Evento en cola pendiente
- **🔄** - Reintentando envío
- **❌** - Error al enviar

### Badges de Eventos

- `PAGE_VIEW` - Azul (navegación)
- `CLICK` - Verde (interacción)
- `SCROLL` - Cyan (scroll)
- `CUSTOM` - Púrpura (eventos custom)
- `SESSION_START` - Amarillo (inicio sesión)
- `SESSION_END` - Naranja (fin sesión)
- `WEB_VITALS` - Rosa (métricas)
- `ERROR` - Rojo (errores)

## Flujo de Testing

### 1. Testing Normal (API funcionando)

1. Interactúa con la página (clicks, scroll, navegación)
2. Observa eventos en el monitor
3. Verifica en consola del browser:
   ```
   tracelog:log { namespace: 'EventManager', message: 'Event captured', data: {...} }
   ```
4. Verifica que eventos llegan a tu API

### 2. Testing con Fallos (API caída)

1. **Detén la API** (Ctrl+C en terminal de middleware)
2. Interactúa con la página
3. Observa en monitor:
   - Estado cambia a `❌`
   - Eventos quedan en cola con `⏳`
   - Cola aumenta: `Cola: 5`
4. **Reinicia la API**
5. Observa recuperación automática:
   - Eventos se reenvían
   - Estado vuelve a `▶️`
   - Cola se vacía: `Cola: 0`

### 3. Testing de Reintentos

1. Configura API para retornar errores 500
2. Interactúa con la página
3. Observa en consola:
   ```
   SenderManager: Failed to send events
   SenderManager: Retry scheduled (delay: 2000ms)
   ```
4. Monitor muestra `🔄` durante reintentos

## Eventos Disponibles

### Automáticos

- **Page View** - Cambio de ruta (navegación SPA)
- **Click** - Clicks en elementos interactivos
- **Scroll** - Scroll en la página
- **Session Start** - Inicio de sesión
- **Web Vitals** - Métricas de rendimiento

### Personalizados

```javascript
// Agregar al carrito
TraceLog.event('add_to_cart', {
  product_id: '1',
  product_name: 'Laptop Pro M2',
  timestamp: Date.now(),
});

// Submit formulario contacto
TraceLog.event('contact_form_submit', {
  name: 'Juan',
  email: 'juan@email.com',
  message: 'Hola...',
});
```

## Testing de Recuperación

### Funciones de Testing Disponibles

Abre la consola del browser y ejecuta:

```javascript
// Ver estadísticas de recuperación
window.testRecoveryStats();
// Output: Circuit Breaker Resets, Failures, Timeouts, etc.

// Forzar recuperación manual del sistema
window.triggerSystemRecovery();

// Limpiar fingerprints (prevención memory leaks)
window.triggerFingerprintCleanup();

// Test completo de pérdida de eventos (Fix #2)
await window.testEventLossPrevention();
```

## Arquitectura del Playground

```
┌──────────────┐
│   Browser    │
│  (localhost) │
└──────┬───────┘
       │
       │ id: 'localhost:3002'
       ↓
┌──────────────────────────────────┐
│      TraceLog Client             │
│  • ConfigManager                 │
│  • EventManager                  │
│  • SenderManager                 │
└──────┬───────────────────────────┘
       │
       │ GET  /config
       │ POST /collect
       ↓
┌──────────────────────────────────┐
│   API (tracelog-middleware)      │
│   http://localhost:3002          │
│                                  │
│  • Project validation            │
│  • Event filtering               │
│  • Session management            │
└──────────────────────────────────┘
```

## Ventajas de Testing con API Real

✅ **Sin Mocks** - Comportamiento 100% real
✅ **Testing Completo** - Valida toda la cadena (client → middleware → backend)
✅ **Debugging Real** - Logs reales de producción
✅ **Configuración Dinámica** - Config desde API (samplingRate, tags, etc.)
✅ **Simulación Realista** - Controla fallos desde la API real

## Troubleshooting

### Error: "Origin not allowed"

**Causa**: Puerto no está en ALLOWED_ORIGINS

**Solución**: Verifica que `http://localhost:3002` esté en `/src/managers/config.manager.ts` línea 8-18

### Error: "Config URL is not valid"

**Causa**: ID de proyecto incorrecto

**Solución**: Usa formato `localhost:PORT` (ej: `localhost:3002`)

### Eventos no llegan a la API

1. Verifica que la API esté corriendo: `curl http://localhost:3002/config`
2. Revisa CORS en la API
3. Verifica logs en consola del browser
4. Verifica Network tab (requests a `/config` y `/collect`)

### Cola crece infinitamente

**Causa**: API retornando errores persistentes

**Solución**:
1. Verifica logs de la API
2. Verifica formato de response (debe ser JSON)
3. Ejecuta `window.triggerSystemRecovery()` para reset manual