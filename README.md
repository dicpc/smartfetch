# SmartFetch

Wrapper avanzado sobre la API nativa `fetch` de JavaScript, con soporte para reintentos automáticos, timeout configurable y eventos del ciclo de vida. Escrito en TypeScript estricto, sin dependencias en runtime.

## Instalación

```bash
npm install smartfetch
```

## Inicio rápido

```typescript
import { SmartFetchBuilder } from 'smartfetch'

const client = new SmartFetchBuilder()
  .withBaseUrl('https://api.example.com')
  .withTimeout(5_000)
  .withRetry(2, 1_000)
  .withHeader('Authorization', 'Bearer tu-token')
  .build()

const { data } = await client.get<Usuario[]>('/usuarios')
```

## API

### SmartFetchBuilder

Construye el cliente paso a paso con una API fluida (patrón Builder).

| Método | Descripción |
|---|---|
| `.withBaseUrl(url)` | URL base que se antepone a todos los paths |
| `.withTimeout(ms)` | Cancela la petición si supera N milisegundos |
| `.withRetry(max, delay?, codigos?)` | Reintenta ante errores 5xx o de red |
| `.withHeader(clave, valor)` | Header por defecto para todas las peticiones |
| `.build()` | Instancia y retorna el `SmartFetchClient` configurado |

### SmartFetchClient

| Método | Descripción |
|---|---|
| `.get<T>(url, config?)` | Petición GET |
| `.post<T>(url, body?, config?)` | Petición POST |
| `.put<T>(url, body?, config?)` | Petición PUT |
| `.patch<T>(url, body?, config?)` | Petición PATCH |
| `.delete<T>(url, config?)` | Petición DELETE |
| `.on(evento, handler)` | Suscribirse a eventos del ciclo de vida |

Todos los métodos retornan `Promise<SmartFetchResponse<T>>`, por lo que funcionan tanto con `async/await` como con `.then()/.catch()`.

### Eventos del ciclo de vida

| Evento | Payload | Cuándo se emite |
|---|---|---|
| `request:start` | `{ url, method }` | Antes de enviar la petición |
| `request:end` | `{ url, method, status }` | Al recibir respuesta exitosa |
| `retry` | `{ url, attempt, error }` | Antes de cada reintento |
| `timeout` | `{ url, timeoutMs }` | Cuando se cancela por timeout |

## Ejemplos de uso

### GET con tipado genérico

```typescript
interface Post {
  id: number
  title: string
}

// Con async/await
const { data } = await client.get<Post>('/posts/1')
console.log(data.title) // TypeScript sabe que title es string

// Con .then()
client.get<Post[]>('/posts')
  .then(({ data }) => console.log(data.length))
  .catch((err) => console.error(err.message))
```

### POST con body

```typescript
const { data } = await client.post<Post>('/posts', {
  title: 'Mi nuevo post',
  body: 'Contenido del post',
  userId: 1,
})
```

### Retry automático

```typescript
const client = new SmartFetchBuilder()
  .withBaseUrl('https://api.example.com')
  .withRetry(3, 2_000, [500, 502, 503])
  // 3 reintentos, 2 segundos entre cada uno, solo ante esos códigos
  .build()
```

### Suscripción a eventos

```typescript
client
  .on('request:start', ({ method, url }) => {
    console.log(`→ [${method}] ${url}`)
  })
  .on('retry', ({ attempt }) => {
    console.warn(`Reintentando... intento #${attempt}`)
  })
  .on('timeout', ({ timeoutMs }) => {
    console.error(`Petición cancelada después de ${timeoutMs}ms`)
  })
```

## Conceptos aplicados

| Concepto | Dónde |
|---|---|
| Tipos genéricos | `client.get<T>()` — respuestas tipadas en compile-time |
| Tipos funcionales | `RequestInterceptor`, `ResponseInterceptor`, `Middleware` |
| Async/await | Toda la lógica interna de peticiones |
| AbortController | Implementación del timeout |
| AOP | Timeout y retry como cross-cutting concerns |
| Join-point | Cada llamada a `fetch()` |
| Point-cut | `statusCodesToRetry` — condición que activa el retry |
| Advice | Loop de reintento y lógica de timeout |
| Patrón Observer | `EventBus<SmartFetchEvents>` para eventos del ciclo de vida |
| Patrón Builder | `SmartFetchBuilder` con API fluida |
| Patrón Strategy | Políticas de reintento intercambiables |
| Closures | Configuración capturada en el scope del constructor |

## Licencia

MIT