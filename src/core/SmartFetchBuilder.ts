// src/core/SmartFetchBuilder.ts

import type { SmartFetchConfig } from '../types/index.js'
import { SmartFetchClient } from './SmartFetchClient.js'

/**
 * [Design Pattern - Builder] Constructs a SmartFetchClient using a fluent API.
 *
 * Each method stores partial configuration and returns `this`,
 * allowing method chaining. The client is only instantiated when
 * .build() is called.
 *
 * [Closure] The accumulated config is captured in the instance scope
 * until .build() is invoked.
 *
 * @example
 * const client = new SmartFetchBuilder()
 *   .withBaseUrl('https://api.example.com')
 *   .withTimeout(5_000)
 *   .withRetry(3, 1_000)
 *   .withHeader('Authorization', 'Bearer token')
 *   .build()
 */
export class SmartFetchBuilder {
  private baseUrl: string = ''
  private config: SmartFetchConfig = {}

  /**
   * Sets the base URL prepended to all request paths.
   *
   * @param url - Base URL (e.g. 'https://api.example.com')
   */
  withBaseUrl(url: string): this {
    this.baseUrl = url
    return this
  }

  /**
   * Sets the maximum timeout in milliseconds.
   * Requests exceeding this time are cancelled via AbortController.
   *
   * @param ms - Milliseconds before cancelling (default: 8000)
   */
  withTimeout(ms: number): this {
    this.config.timeout = ms
    return this
  }

  /**
   * [Design Pattern - Strategy] Configures the retry policy.
   *
   * @param maxRetries         - Number of extra attempts (0 = no retries)
   * @param baseDelayMs        - Milliseconds to wait between retries (default: 1000)
   * @param statusCodesToRetry - HTTP status codes that trigger a retry
   */
  withRetry(
    maxRetries: number,
    baseDelayMs: number = 1_000,
    statusCodesToRetry: number[] = [500, 502, 503, 504]
  ): this {
    this.config.retry = { maxRetries, baseDelayMs, statusCodesToRetry }
    return this
  }

  /**
   * Adds a default header sent on every request.
   * Can be called multiple times to add several headers.
   *
   * @param key   - Header name (e.g. 'Authorization')
   * @param value - Header value (e.g. 'Bearer token123')
   */
  withHeader(key: string, value: string): this {
    if (!this.config.headers) {
      this.config.headers = {}
    }

    if (
      typeof this.config.headers === 'object' &&
      !Array.isArray(this.config.headers) &&
      !(this.config.headers instanceof Headers)
    ) {
      (this.config.headers as Record<string, string>)[key] = value
    }

    return this
  }

  /**
   * Instantiates and returns the configured SmartFetchClient.
   * Must be the last call in the chain.
   *
   * @returns A ready-to-use SmartFetchClient instance
   */
  build(): SmartFetchClient {
    return new SmartFetchClient(this.baseUrl, this.config)
  }
}