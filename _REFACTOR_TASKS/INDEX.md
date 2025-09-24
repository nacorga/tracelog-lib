# TraceLog Refactor v2.0 - Índice de Documentación

## 📚 Guía de Lectura

### 🚀 Para Empezar (LEER EN ORDEN)

1. **[README.md](./README.md)** ⭐ **INICIO AQUÍ**
   - Contexto general del refactor
   - Objetivos y principios clave
   - Plan de tareas por fase
   - Testing strategy completa

2. **[ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)** 🔍
   - Estado actual del código (77 archivos)
   - Problemas identificados
   - Métricas de complejidad
   - Estrategia de migración por componente

3. **[DECISION_LOG.md](./DECISION_LOG.md)** 📋
   - Todas las decisiones arquitectónicas (DR-001 a DR-015)
   - Justificaciones y alternativas
   - Impacto en LOC (-47% estimado)

4. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** 🛠️
   - Workflow paso a paso
   - Patrones de código recomendados
   - Anti-patrones a evitar
   - Debugging y troubleshooting

---

## 📋 Tareas por Fase

### Fase 1: Setup y Preparación
- **[PHASE_1_SETUP.md](./PHASE_1_SETUP.md)**
  - Crear estructura `src_v2/`
  - Configurar build dual (src + src_v2)
  - Configurar Vitest para tests unitarios
  - Scripts de comparación y migración
  - Tests E2E base

### Fase 2: Refactorización Core (PRÓXIMAMENTE)
- `PHASE_2_EVENT_MANAGER.md` - Simplificar EventManager
- `PHASE_2_SESSION_MANAGER.md` - Simplificar SessionManager
- `PHASE_2_SENDER_MANAGER.md` - Simplificar SenderManager

### Fase 3: Features Secundarias (PRÓXIMAMENTE)
- `PHASE_3_TAGS_SAMPLING.md` - Simplificar Tags y Sampling
- `PHASE_3_UTILS_CONSOLIDATION.md` - Consolidar Utils
- `PHASE_3_CONSTANTS.md` - Consolidar Constants

### Fase 4: Handlers (PRÓXIMAMENTE)
- `PHASE_4_HANDLERS.md` - Revisar todos los handlers

### Fase 5: Validación Final (PRÓXIMAMENTE)
- `PHASE_5_TESTING.md` - Testing exhaustivo
- `PHASE_5_MIGRATION.md` - Migración final src_v2 → src

---

## 🎯 Documentos por Propósito

### Para Entender el Contexto
- `README.md` - Visión general
- `ARCHITECTURE_ANALYSIS.md` - Problemas actuales
- `DECISION_LOG.md` - Por qué tomamos cada decisión

### Para Implementar
- `IMPLEMENTATION_GUIDE.md` - Guía práctica completa
- `PHASE_X_*.md` - Instrucciones específicas por fase

### Para Validar
- `PHASE_1_SETUP.md` - Checklist de setup
- `README.md` - Testing strategy
- `IMPLEMENTATION_GUIDE.md` - Criterios de éxito

---

## 📊 Estado del Proyecto

### ✅ Completado
- [x] Análisis de arquitectura actual
- [x] Decisiones arquitectónicas documentadas
- [x] Plan de refactor definido
- [x] Documentación completa
- [x] Guía de implementación

### 🚧 En Progreso
- [ ] PHASE_1: Setup src_v2/
- [ ] Configuración Vitest
- [ ] Tests base

### 📅 Pendiente
- [ ] PHASE_2: Refactor Core
- [ ] PHASE_3: Features Secundarias
- [ ] PHASE_4: Handlers
- [ ] PHASE_5: Validación y Migración

---

## 🔑 Conceptos Clave

### Elementos Intocables 🔒
```typescript
// src/types/event.types.ts - NO MODIFICAR
export interface EventData {
  type: EventType;
  page_url: string;
  timestamp: number;
  // ... resto de campos
}

// API Pública - NO BREAKING CHANGES
export const TraceLog = {
  init: (config: AppConfig) => Promise<void>,
  event: (name: string, metadata?) => void,
  destroy: () => Promise<void>
};
```

### Simplificaciones Principales
```
Circuit Breaker:    ~300 LOC → ~50 LOC   (-83%)
Deduplicación:      Map → lastEvent       (-85%)
Cross-Tab Session:  Complejo → Básico     (-84%)
Tags System:        Condicional → Estático (-89%)
Sampling:           Granular → Global      (-87%)
```

---

## 🧪 Testing Strategy

### 3 Capas de Tests
```
1. Unit Tests (Vitest)
   ├── Utils: 90%+ coverage
   ├── Managers: 80%+ coverage
   └── Handlers: 70%+ coverage

2. Integration Tests (Vitest)
   └── Flujos completos entre componentes

3. E2E Tests (Playwright)
   ├── DTO Validation (CRÍTICO)
   └── Funcionalidad completa
```

---

## 🚀 Comandos Rápidos

```bash
# Desarrollo
npm run dev:v2              # Build watch src_v2
npm run test:unit:watch     # Tests unitarios watch

# Testing
npm run test:unit           # Tests unitarios
npm run test:integration    # Tests integración
npm run test:e2e:v2         # Tests E2E v2
npm run test:all:v2         # Todos los tests
npm run test:coverage       # Coverage report

# Validación
npm run check:v2            # Lint + format
npm run compare-output      # Comparar src vs src_v2
npm run build:v2            # Build src_v2

# Migración
npm run migrate:v2          # src_v2 → src (FINAL)
```

---

## 📈 Métricas Objetivo

### Código
- **Archivos**: 77 → 45 (-42%)
- **LOC**: ~15,000 → ~8,000 (-47%)
- **Complejidad**: 8 → 4 (-50%)

### Testing
- **Coverage**: 0% → 85%+
- **Unit Tests**: 0 → 80+
- **E2E Tests**: ~10 → Mantener 100%

### Calidad
- **TypeScript Errors**: 0
- **Lint Warnings**: 0
- **Bundle Size**: -20-30%
- **Performance**: =o mejor

---

## 🔗 Referencias Externas

- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Web Vitals](https://web.dev/vitals/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📞 Soporte

### Problemas Comunes
1. **Tests fallan** → Ver `IMPLEMENTATION_GUIDE.md` > Debugging
2. **DTO cambió** → Ver `DECISION_LOG.md` > DR-002
3. **Build falla** → Ver `IMPLEMENTATION_GUIDE.md` > Troubleshooting
4. **Coverage bajo** → Ver `README.md` > Testing Strategy

### Escalación
Si encuentras algo no documentado o necesitas tomar una decisión no prevista:

1. Documentar en `DECISION_LOG.md` (crear DR-XXX)
2. Actualizar guías relevantes
3. Continuar con implementación

---

## ✅ Quick Start

```bash
# 1. Leer documentación
cat _REFACTOR_TASKS/README.md
cat _REFACTOR_TASKS/ARCHITECTURE_ANALYSIS.md
cat _REFACTOR_TASKS/DECISION_LOG.md

# 2. Ejecutar Phase 1
cat _REFACTOR_TASKS/PHASE_1_SETUP.md
# ... seguir instrucciones

# 3. Verificar setup
npm run build:v2
npm run test:e2e:v2
npm run test:unit

# 4. Empezar Phase 2
# ... próximamente
```

---

**Última actualización**: 2025-09-24
**Versión**: 2.0.0 (en desarrollo)
**Estado**: Planificación completa ✅