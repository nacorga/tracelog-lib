# 🚀 EMPEZAR AQUÍ - TraceLog Refactor v2.0

## ⚡ Quick Start (5 minutos)

### 1️⃣ Lee el Índice (1 min)
```bash
cat _REFACTOR_TASKS/INDEX.md
```
**Qué aprenderás**: Mapa completo de toda la documentación

### 2️⃣ Lee el README (3 min)
```bash
cat _REFACTOR_TASKS/README.md
```
**Qué aprenderás**: Contexto, objetivos, plan general

### 3️⃣ Ejecuta Phase 1 Setup
```bash
cat _REFACTOR_TASKS/PHASE_1_SETUP.md
# Luego seguir las instrucciones
```
**Qué harás**: Configurar `src_v2/` y ambiente de desarrollo

---

## 📚 Documentación Completa

```
_REFACTOR_TASKS/
├── 00_START_HERE.md              ← ESTÁS AQUÍ
├── INDEX.md                       ← Mapa de navegación
├── README.md                      ← Contexto general ⭐
├── ARCHITECTURE_ANALYSIS.md       ← Problemas actuales
├── DECISION_LOG.md                ← Decisiones tomadas
├── IMPLEMENTATION_GUIDE.md        ← Guía práctica
├── PHASE_1_SETUP.md              ← Setup inicial
└── (más fases próximamente...)
```

---

## 🎯 ¿Qué Vamos a Hacer?

### Refactor Exhaustivo pero Conservador

**✅ MANTENER**:
- DTO `EventData` intacto (byte-perfect)
- API pública sin breaking changes
- Todas las funcionalidades core
- Performance igual o mejor

**🔄 SIMPLIFICAR**:
- Circuit breaker: ~300 LOC → ~50 LOC (-83%)
- Deduplicación: Map → último evento (-85%)
- Cross-tab: Complejo → básico (-84%)
- Tags: Condicional → estático (-89%)
- Sampling: Granular → global (-87%)

**📊 RESULTADO**:
- Código: 15,000 → 8,000 LOC (-47%)
- Archivos: 77 → 45 (-42%)
- Complejidad: 8 → 4 (-50%)
- Coverage: 0% → 85%+

---

## 🔑 Conceptos Críticos

### 🔒 NO TOCAR (NUNCA)

```typescript
// src/types/event.types.ts
export interface EventData {
  type: EventType;
  page_url: string;
  timestamp: number;
  // ... resto NO MODIFICAR
}

// API pública
export const TraceLog = {
  init, event, destroy  // NO CAMBIAR firmas
};
```

### 🚧 Desarrollo en src_v2/

```bash
src/         # ⚠️ NO TOCAR hasta migración final
src_v2/      # 🚧 Aquí trabajamos
```

### 🧪 Testing Completo

```
Unit Tests (Vitest)     → Utils, Managers (90%+, 80%+)
Integration (Vitest)    → Flujos entre componentes
E2E (Playwright)        → DTO validation, Funcionalidad
```

---

## 📋 Plan de 5 Fases

### Fase 1: Setup (EMPEZAR AQUÍ)
```bash
✅ Tareas:
1. Crear src_v2/ copiando src/
2. Configurar build dual
3. Configurar Vitest
4. Tests base
5. Scripts comparación/migración

📄 Doc: PHASE_1_SETUP.md
⏱️ Tiempo: 2-3 horas
```

### Fase 2: Core Refactoring
```bash
🚧 Tareas:
1. Simplificar EventManager
2. Simplificar SessionManager
3. Simplificar SenderManager

📄 Doc: (próximamente)
⏱️ Tiempo: 1 semana
```

### Fase 3: Features Secundarias
```bash
📅 Tareas:
1. Simplificar Tags/Sampling
2. Consolidar Utils
3. Consolidar Constants

📄 Doc: (próximamente)
⏱️ Tiempo: 3-4 días
```

### Fase 4: Handlers
```bash
📅 Tareas:
1. Revisar handlers core
2. Simplificar error/network
3. Tests handlers

📄 Doc: (próximamente)
⏱️ Tiempo: 2-3 días
```

### Fase 5: Validación y Migración
```bash
📅 Tareas:
1. Testing exhaustivo
2. Coverage > 80%
3. Performance benchmarks
4. Migración src_v2 → src
5. Release 2.0.0

📄 Doc: (próximamente)
⏱️ Tiempo: 3-4 días
```

---

## 🚀 Comandos Esenciales

```bash
# Setup inicial (Fase 1)
npm install -D vitest @vitest/coverage-v8 jsdom
cp -r src src_v2

# Desarrollo
npm run dev:v2              # Build watch
npm run test:unit:watch     # Tests watch

# Validación
npm run test:all:v2         # Todos los tests
npm run test:coverage       # Coverage
npm run compare-output      # Comparar outputs
npm run check:v2            # Lint + format

# Migración final (Fase 5)
npm run migrate:v2          # src_v2 → src
```

---

## ✅ Checklist Pre-Inicio

Antes de empezar, asegúrate de:

- [ ] Entender que EventData NO se modifica
- [ ] Entender que API pública NO cambia
- [ ] Tener Node.js + npm instalados
- [ ] Tener tests E2E actuales pasando
- [ ] Tener branch limpio en Git
- [ ] Haber leído INDEX.md y README.md

---

## 📊 Decisiones Clave Tomadas

**DR-001**: Desarrollo paralelo en src_v2/
**DR-002**: EventData intacto (crítico)
**DR-003**: Circuit breaker simple vs complejo
**DR-004**: Deduplicación último evento
**DR-005**: Cross-tab básico
**DR-006**: Tags estáticos
**DR-007**: Sampling global
**DR-010**: Unit + Integration + E2E tests

Ver todas en: `DECISION_LOG.md`

---

## 🐛 ¿Problemas?

### Tests Fallan
→ `IMPLEMENTATION_GUIDE.md` > Debugging

### DTO Cambió
→ `DECISION_LOG.md` > DR-002
→ `npm run compare-output`

### Build Falla
→ `IMPLEMENTATION_GUIDE.md` > Troubleshooting

### Coverage Bajo
→ `README.md` > Testing Strategy

---

## 🎯 Objetivo Final

```
Código más simple, mantenible y robusto
que hace EXACTAMENTE lo mismo
pero MEJOR.

✅ -47% LOC
✅ -50% Complejidad
✅ +85% Coverage
✅ 100% Funcionalidad
✅ 0 Breaking Changes
```

---

## 👉 Próximo Paso

```bash
# 1. Lee el índice completo
cat _REFACTOR_TASKS/INDEX.md

# 2. Lee el contexto general
cat _REFACTOR_TASKS/README.md

# 3. Ejecuta Phase 1
cat _REFACTOR_TASKS/PHASE_1_SETUP.md
# ... sigue las instrucciones paso a paso

# 4. ¡Manos a la obra! 🚀
```

---

**Creado**: 2025-09-24
**Versión**: 2.0.0 (en desarrollo)
**Estado**: Listo para empezar ✅

¡Éxito en el refactor! 🎉