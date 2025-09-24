# Instrucciones Generales - Refactorización TraceLog Library v1.0

## 📌 Contexto General

La librería TraceLog actualmente contiene **sobreingeniería excesiva** con funcionalidades complejas que generan más problemas que soluciones. El objetivo es simplificar la arquitectura para una **primera versión estable y mantenible**.

## 🎯 Objetivos Principales

1. **Reducir complejidad**: De ~77 archivos TypeScript a ~30-40
2. **Mantener tipos de eventos intactos**: `EventData` en `src/types/event.types.ts` NO debe modificarse
3. **Preservar API pública**: `init()`, `event()`, `destroy()` deben seguir funcionando
4. **Validar con tests E2E**: Cada tarea debe validarse con tests Playwright antes de continuar

## 🔒 Restricciones Críticas

### ❌ NO Modificar
- `src/types/event.types.ts` - Los tipos de eventos son definitivos
- API pública expuesta en `src/api.ts`
- Estructura de `EventData` que se envía al backend

### ✅ SÍ Modificar/Eliminar
- Managers complejos (circuit breaker, recovery, cross-tab, sampling, tags)
- Handlers avanzados (error, network)
- Sistema de deduplicación con fingerprints Map
- Integraciones externas (Google Analytics)
- Validaciones excesivas
- Constantes y utilities innecesarias

## 📐 Arquitectura Objetivo

### Estructura Simplificada
```
src/
├── api.ts                    # API pública (mantener)
├── app.ts                    # Orquestador simplificado
├── handlers/                 # Solo handlers esenciales
│   ├── click.handler.ts
│   ├── scroll.handler.ts
│   ├── page-view.handler.ts
│   ├── session.handler.ts
│   └── performance.handler.ts
├── managers/                 # Managers básicos
│   ├── event.manager.ts      # Simplificado sin circuit breaker
│   ├── session.manager.ts    # Sin cross-tab ni recovery
│   ├── sender.manager.ts     # Envío básico con retry simple
│   ├── storage.manager.ts    # Abstracción localStorage
│   ├── config.manager.ts     # Carga de configuración
│   └── state.manager.ts      # Estado global
├── utils/                    # Solo utilidades esenciales
│   ├── browser/              # Detección navegador/dispositivo
│   ├── data/                 # Sanitización y normalización
│   └── validations/          # Validaciones básicas
├── types/                    # Types esenciales
│   ├── event.types.ts        # ⚠️ NO MODIFICAR
│   ├── config.types.ts
│   └── state.types.ts
└── constants/                # Solo constantes necesarias
    ├── api.constants.ts
    └── timing.constants.ts
```

## 🔄 Orden de Ejecución

**IMPORTANTE**: Seguir este orden para evitar romper dependencias

1. **Tarea 1**: Eliminar handlers avanzados (error, network)
2. **Tarea 2**: Eliminar managers complejos (sampling, tags, cross-tab, recovery)
3. **Tarea 3**: Eliminar circuit breaker y sistema de recovery de EventManager
4. **Tarea 4**: Simplificar sistema de deduplicación
5. **Tarea 5**: Eliminar integración Google Analytics
6. **Tarea 6**: Reducir validaciones en App.ts
7. **Tarea 7**: Limpiar utilities innecesarias
8. **Tarea 8**: Reducir constantes
9. **Tarea 9**: Limpiar types innecesarios
10. **Tarea 10**: Actualizar documentación

## ✅ Validación por Tarea

Después de completar cada tarea:

```bash
# 1. Verificar lint y formato
npm run check

# 2. Construir el proyecto
npm run build:all

# 3. Ejecutar tests E2E
npm run test:e2e

# 4. Validar en playground
npm run serve:test
```

## 📋 Checklist por Tarea

Para cada tarea completada, verificar:

- [ ] Archivos eliminados/modificados según instrucciones
- [ ] No hay errores de TypeScript (`npm run build`)
- [ ] Lint y formato pasando (`npm run check`)
- [ ] Tests E2E relevantes pasando
- [ ] API pública sigue funcionando
- [ ] `EventData` types intactos
- [ ] Actualizar imports en archivos afectados

## 🧪 Tests E2E Requeridos

Crear/mantener tests que validen:

### Core Functionality
```typescript
// Inicialización básica
test('should initialize library', async () => {
  await TraceLog.init({ id: 'test' });
  // Validar que se inicializa correctamente
});

// Eventos básicos
test('should track page_view event', async () => { ... });
test('should track click event', async () => { ... });
test('should track scroll event', async () => { ... });
test('should track custom event', async () => { ... });
test('should track web_vitals event', async () => { ... });

// Sesiones
test('should create session_start', async () => { ... });
test('should create session_end', async () => { ... });

// Envío de datos
test('should send events to backend', async () => { ... });
test('should not send duplicate events', async () => { ... });
```

## 🚨 Señales de Alerta

Detener inmediatamente si:

- Tests E2E fallan después de cambios
- `EventData` structure cambia
- API pública (`init`, `event`, `destroy`) deja de funcionar
- Build falla con errores de TypeScript

## 📝 Documentación Final

Al completar todas las tareas:

1. Actualizar `CLAUDE.md` con arquitectura simplificada
2. Actualizar `README.md` eliminando features removidas
3. Actualizar `package.json` si cambió la API
4. Documentar breaking changes si los hay

## 🎯 Criterio de Éxito Global

La refactorización será exitosa cuando:

- ✅ Reducción significativa de archivos (objetivo: ~40 archivos)
- ✅ Todos los tests E2E pasando
- ✅ API pública 100% funcional
- ✅ `EventData` types sin modificaciones
- ✅ Código más mantenible y comprensible
- ✅ Sin funcionalidades complejas que causen problemas

---

**Fecha de creación**: 2025-09-24
**Versión objetivo**: 1.0.0
**Responsable**: Equipo TraceLog