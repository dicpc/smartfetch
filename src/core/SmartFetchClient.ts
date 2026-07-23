import { EventBus } from '../events/EventBus.js'
import type {
  SmartFetchConfig,
  SmartFetchEvents,
  SmartFetchResponse,
} from '../types/index.js'

/**
 * Waits N milliseconds without blocking the event loop.
 * [Async concept] Wraps setTimeout in a Promise to enable await syntax.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Default configuration applied when values are not provided.
 * [Closure] Captured at module scope, never mutated.
 */
const DEFAULT_CONFIG = {
  timeout: 8_000,
  retry: {
    maxRetries: 0,
    baseDelayMs: 1_000,
    statusCodesToRetry: [500, 502, 503, 504],
  },
}

/**
 * Main HTTP client for SmartFetch.
 *
 * Wraps the native fetch API adding:
 * - Configurable timeout via AbortController
 * - Automatic retry on 5xx errors and network failures
 * - Lifecycle events via EventBus (Observer pattern)
 * - Dual API: works with async/await and .then()/.catch()
 *
 * AOP concepts:
 *   Join-point : each fetch() call
 *   Point-cut  : statusCodesToRetry + network errors
 *   Advice     : retry loop and timeout logic
 *   Weaving    : private request() orchestrates all aspects
 *
 * @example
 * const client = new SmartFetchClient('https://api.example.com', {
 *   timeout: 5000,
 *   retry: { maxRetries: 2, baseDelayMs: 500 }
 * })
 * const { data } = await client.get<User[]>('/users')
 */
export class SmartFetchClient {
  private readonly config: SmartFetchConfig
  private readonly eventBus: EventBus<SmartFetchEvents>
  private readonly baseUrl: string

  /**
   * @param baseUrl - Base URL prepended to all request paths
   * @param config  - Partial config merged with DEFAULT_CONFIG
   */
  constructor(baseUrl: string = '', config: SmartFetchConfig = {}) {
    this.baseUrl = baseUrl
    this.config = {
      ...config,
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
      retry: {
        ...DEFAULT_CONFIG.retry,
        ...config.retry,
      },
    }
    this.eventBus = new EventBus<SmartFetchEvents>()
  }

  /**
   * Subscribe to a lifecycle event.
   * Returns `this` to allow method chaining.
   *
   * @param event   - Event name ('request:start' | 'request:end' | 'retry' | 'timeout')
   * @param handler - Function called when the event fires
   */
  on<K extends keyof SmartFetchEvents>(
    event: K,
    handler: (payload: SmartFetchEvents[K]) => void
  ): this {
    this.eventBus.on(event, handler)
    return this
  }

  /**
   * Performs a GET request.
   * @param url    - Path relative to baseUrl
   * @param config - Per-request config override
   */
  get<T>(url: string, config?: Partial<SmartFetchConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>('GET', url, undefined, config)
  }

  /**
   * Performs a POST request with JSON-serialized body.
   * @param url    - Path relative to baseUrl
   * @param body   - Request body (auto-serialized to JSON)
   * @param config - Per-request config override
   */
  post<T>(url: string, body?: unknown, config?: Partial<SmartFetchConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>('POST', url, body, config)
  }

  /**
   * Performs a PUT request.
   */
  put<T>(url: string, body?: unknown, config?: Partial<SmartFetchConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>('PUT', url, body, config)
  }

  /**
   * Performs a PATCH request.
   */
  patch<T>(url: string, body?: unknown, config?: Partial<SmartFetchConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>('PATCH', url, body, config)
  }

  /**
   * Performs a DELETE request.
   */
  delete<T>(url: string, config?: Partial<SmartFetchConfig>): Promise<SmartFetchResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config)
  }

  /**
   * Internal method that orchestrates the full request lifecycle.
   * Applies timeout and retry aspects around the native fetch call.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    overrides?: Partial<SmartFetchConfig>
  ): Promise<SmartFetchResponse<T>> {
    const merged: SmartFetchConfig = {
  ...this.config,
  ...overrides,
}

    const fullUrl             = this.baseUrl + path
    const maxRetries          = merged.retry?.maxRetries          ?? 0
    const baseDelayMs         = merged.retry?.baseDelayMs         ?? 1_000
    const statusCodesToRetry  = merged.retry?.statusCodesToRetry  ?? [500, 502, 503, 504]

    // AOP — Before advice: notify listeners that a request is starting
    this.eventBus.emit('request:start', { url: fullUrl, method })

    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const controller = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined

      if (merged.timeout) {
        timer = setTimeout(() => controller.abort(), merged.timeout)
      }

      try {
        const { timeout, retry, cache: _cache, signal: userSignal, ...fetchInit } = merged

        const response = await fetch(fullUrl, {
          ...fetchInit,
          method,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: userSignal ?? controller.signal,
        })

        clearTimeout(timer)

        // AOP — Point-cut: should the retry aspect activate?
        const isRetryableStatus =
          !response.ok &&
          statusCodesToRetry.includes(response.status) &&
          attempt <= maxRetries

        if (isRetryableStatus) {
          this.eventBus.emit('retry', {
            url: fullUrl,
            attempt,
            error: new Error(`HTTP ${response.status}`),
          })
          await sleep(baseDelayMs)
          continue
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = (await response.json()) as T

        // AOP — After advice: notify listeners of successful completion
        this.eventBus.emit('request:end', { url: fullUrl, method, status: response.status })

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }

      } catch (error) {
        clearTimeout(timer)

        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutMs = merged.timeout!
          this.eventBus.emit('timeout', { url: fullUrl, timeoutMs })
          throw new Error(`Request to "${fullUrl}" timed out after ${timeoutMs}ms`)
        }

        lastError = error

        if (attempt <= maxRetries) {
          this.eventBus.emit('retry', {
            url: fullUrl,
            attempt,
            error: error instanceof Error ? error : new Error(String(error)),
          })
          await sleep(baseDelayMs)
        }
      }
    }

    throw lastError
  }
}