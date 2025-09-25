# TraceLog Playground - Demo Interactivo

Playground interactivo para probar y demostrar las funcionalidades de TraceLog en tiempo real.

## 🎯 Propósito

- **Desarrollo**: Testing rápido de features durante desarrollo
- **Demo**: Mostrar capacidades de TraceLog a stakeholders
- **Debugging**: Visualizar eventos y comportamientos en tiempo real
- **E2E Tests**: Base para tests automatizados con Playwright

## 🚀 Inicio Rápido

```bash
# Inicia playground con build automático y servidor
npm run playground:dev

# Solo el servidor (requiere build manual previo)
npm run serve

# Solo build sin servidor
npm run playground:setup
```

**URL**: http://localhost:3000

### Modos Disponibles

- **Demo Normal**: Visualización completa con monitor
- **E2E Test**: Auto-detección, monitor oculto, eventos automáticos
- **QA Mode**: Debugging extendido con logs detallados

## ⚙️ Configuración

### Inicialización por Defecto

```javascript
// Auto-inicialización en modo demo (envía eventos a API local)
await TraceLog.init({
  id: 'localhost:3002',  // API local (si disponible)
});

// Modo E2E/Testing (sin HTTP calls - usa SpecialProjectId.Skip)
await TraceLog.init({
  id: 'skip', // No envía eventos, solo simula
});
```

### Detección Automática

El playground detecta automáticamente:

- **E2E Mode**: Playwright, HeadlessChrome, URL param `?e2e=true`
- **Test Mode**: URL param `?mode=test`
- **Scenarios**: URL param `?scenario=basic|navigation|ecommerce`
- **Project ID**: URL param `?project-id=custom-id` (default: 'playground-test-project')

### Bridge API Consistency

Usa `__traceLogBridge` consistentemente:
```javascript
// Helper unificado
function getTraceLogInstance() {
  return window.__traceLogBridge || window.TraceLog;
}

// Envío de eventos
function sendTraceLogEvent(name, data) {
  const traceLog = getTraceLogInstance();
  return traceLog?.sendCustomEvent(name, data);
}
```

## 📊 Monitor de Eventos

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
- `WEB_VITALS` - Rosa (métricas)
- `ERROR` - Rojo (errores)

## 🛍️ Simulación E-commerce

### Funcionalidades Disponibles

- **Navegación SPA**: `inicio` → `productos` → `nosotros` → `contacto`
- **Add to Cart**: Botones con tracking de productos
- **Form Submit**: Formulario de contacto con validación
- **Custom Events**: Eventos de negocio específicos

### Eventos Generados

```javascript
// Navegación automática
{ type: 'PAGE_VIEW', page_url: '#productos' }

// Interacción con productos
{
  type: 'CUSTOM',
  custom_event: {
    name: 'add_to_cart',
    metadata: { product_id: '1', product_name: 'Laptop Pro M2' }
  }
}

// Formulario de contacto
{
  type: 'CUSTOM',
  custom_event: {
    name: 'contact_form_submit',
    metadata: { name: 'Juan', email: 'juan@email.com' }
  }
}
```

## 🧪 Testing y Debugging

### Funciones Globales Disponibles

```javascript
// Helpers de testing (disponibles en window.testHelpers)
window.testHelpers.sendCustomEvent('test_event', { key: 'value' });
```

### Bridge Testing Methods

Cuando `NODE_ENV=dev`, el `__traceLogBridge` incluye:

```javascript
const bridge = window.__traceLogBridge;

// Información de estado
bridge.getAppInstance()        // App instance con initialized flag
bridge.getSessionData()        // session info
bridge.getQueueLength()        // eventos pendientes

// Testing helpers
bridge.sendCustomEvent(name, data)  // enviar evento custom
bridge.setSessionTimeout(ms)        // configurar timeout
bridge.isTabLeader?.()              // liderazgo de tab
```

### Console Integration

```javascript
// Escuchar eventos de TraceLog
window.addEventListener('tracelog:log', (event) => {
  const { namespace, message, data } = event.detail;
  console.log(`[${namespace}] ${message}`, data);
});
```

## 🎬 Flujo de Testing

### 1. Testing Manual

1. Abre playground en http://localhost:3000
2. Interactúa con elementos (clicks, navegación, forms)
3. Observa eventos en monitor en tiempo real
4. Verifica logs en console del browser

### 2. Testing Automático (E2E)

```bash
# Ejecuta tests E2E que usan el playground
npm run test:e2e

# Solo un test específico
npm run test:e2e -- --grep "should initialize successfully"
```

Los tests automáticamente:
- Detectan modo E2E (ocultan monitor)
- Usan `__traceLogBridge` para acceso consistente
- Utilizan fixtures de traceLogTest
- Aplican custom matchers como toHaveNoTraceLogErrors()

### 3. Testing de Escenarios

```javascript
// URL params para testing específico
http://localhost:3000?scenario=basic        // Click básico
http://localhost:3000?scenario=navigation   // Navegación entre páginas
http://localhost:3000?scenario=ecommerce    // Add to cart
```

## ✨ Ventajas del Playground

### Desarrollo
✅ **Hot Reload** - Cambios instantáneos con `npm run playground:dev`
✅ **Bridge Consistency** - Usa `__traceLogBridge` como los tests
✅ **Visual Feedback** - Monitor en tiempo real de eventos
✅ **Multiple Scenarios** - Testing automático de diferentes casos

### Testing
✅ **E2E Ready** - Base para tests de Playwright
✅ **Cross-browser** - Funciona en Chrome, Firefox, Safari
✅ **Auto-detection** - Modo E2E sin configuración manual
✅ **Clean State** - Cada reload inicia limpio

### Debugging
✅ **Console Integration** - Eventos `tracelog:log` disponibles
✅ **Queue Visibility** - Monitor de cola de eventos
✅ **Error Tracking** - Captura y muestra errores
✅ **Session Management** - Visualización de estado de sesión

## 🏗️ Arquitectura del Playground

```
┌──────────────┐
│   Browser    │
│  (localhost) │
└──────┬───────┘
       │
       │ __traceLogBridge API
       ↓
┌──────────────────────────────────┐
│      TraceLog Client             │
│  • EventManager                  │
│  • SessionHandler                │
│  • PerformanceHandler            │
└──────┬───────────────────────────┘
       │
       │ Events: tracelog:log
       ↓
┌──────────────────────────────────┐
│   Playground Monitor             │
│   • Visual event queue           │
│   • Real-time status             │
│   • Error visualization          │
└──────────────────────────────────┘
```

## 🔧 Troubleshooting

### Playground no carga
```bash
# Rebuild y reinicia
npm run playground:setup
npm run serve

# O todo junto
npm run playground:dev
```

### Events no aparecen en monitor
- **E2E Mode**: Monitor oculto por diseño
- **JS Errors**: Revisa console del browser
- **Bridge Missing**: Verifica que `NODE_ENV=dev` en build
- **Project ID**: Si usas 'skip', los eventos no se envían (solo se simulan)

### Bridge no disponible
```javascript
// Debug en console
console.log(window.__traceLogBridge);  // debe existir
console.log(window.TraceLog);          // fallback
```

### Tests E2E fallan
1. Verifica que playground esté en puerto 3000
2. Build debe ser `NODE_ENV=dev` para tener bridge
3. Los tests usan fixtures de `traceLogTest` y custom matchers
4. Usa `SpecialProjectId.Skip` ('skip') para tests sin HTTP calls

## 📚 Recursos Relacionados

- **Tests E2E**: `tests/E2E_TESTING_GUIDE.md` - Guía de testing framework
- **Fixtures**: `tests/fixtures/tracelog-fixtures.ts` - TraceLogTestPage class
- **Matchers**: `tests/matchers/tracelog-matchers.ts` - Custom assertions
- **Código fuente**: `playground/script.js` - Lógica del playground
- **Build config**: `vite.config.ts` - Configuración de build
- **Test bridge**: `src/types/window.types.ts` - Definición del bridge
- **Event types**: `src/types/event.types.ts` - Tipos de eventos
- **API types**: `src/types/api.types.ts` - SpecialProjectId enum