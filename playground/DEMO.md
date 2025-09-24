# TraceLog Demo - Resiliencia y Captura de Eventos

Demo que demuestra:
1. **Captura de eventos** - clicks, scrolls, eventos personalizados
2. **Resiliencia** - la web funciona aunque el servidor falle

## Inicio Rápido

```bash
npm run playground:dev
```

Abre http://localhost:3001

## Flujo de Demostración (< 1 minuto)

### 1. Inicializar
- Click **"Iniciar TraceLog"** → 🟢 "Funcionando"

### 2. Capturar eventos
- Click en botones → "✓ 1 evento enviado"
- Scroll en área gris → eventos capturados
- Evento personalizado → escribe nombre y envía

### 3. Simular fallo
- Click **"❌ Simular Fallo"** → 🔴 "Servidor caído"
- Servidor retorna 500 errors

### 4. Web sigue funcionando
- Continúa haciendo clicks → "⏳ 1 evento guardado"
- Eventos persisten en localStorage
- "🔄 Reintentando en Xs..." (backoff exponencial)

### 5. Recuperación
- Click **"✅ Restaurar Servidor"** → "✅ X eventos recuperados"
- Eventos persistidos se envían automáticamente

## Estados Visuales

- 🟢 **Funcionando** - eventos enviados correctamente
- 🔴 **Servidor caído** - servidor retorna errores
- 🔄 **Reintentando** - reintentos automáticos con backoff
- ✅ **Recuperado** - eventos persistidos enviados

## Mensajes del Log

- ✓ verde - evento enviado
- ⏳ amarillo - guardado en localStorage
- 🔄 azul - reintento programado
- ℹ info - evento capturado

## Configuración Especial

Usa `id: 'http-local'` (SpecialProjectId.HttpLocal):
- Envía eventos a `window.location.origin` (servidor local)
- Activa automáticamente modo debug
- Mock server intercepta peticiones y simula fallos

## Arquitectura

```
Usuario → TraceLog → Mock Server → 200 OK / 500 Error → localStorage
```

El mock server intercepta `fetch()` y retorna 200 (normal) o 500 (fallo simulado).