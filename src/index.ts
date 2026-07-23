// src/index.ts

// ── Clases principales ────────────────────────────────────────────────────────
export { SmartFetchClient } from './core/SmartFetchClient.js'
export { SmartFetchBuilder } from './core/SmartFetchBuilder.js'

// ── Tipos públicos ────────────────────────────────────────────────────────────
export type {
  SmartFetchConfig,
  SmartFetchResponse,
  SmartFetchEvents,
  RetryConfig,
  RetryStrategy,
  RequestInterceptor,
  ResponseInterceptor,
  Middleware,
} from './types/index.js'