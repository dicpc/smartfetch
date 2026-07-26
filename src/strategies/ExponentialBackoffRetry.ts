// src/strategies/ExponentialBackoffRetry.ts
import { RetryStrategy } from './RetryStrategy';
import { RetryConfig } from '../types';

/**
 * Estrategia de reintento con retroceso exponencial.
 */
export class ExponentialBackoffRetry implements RetryStrategy {
    /**
     * @param config Configuración de reintentos importada de core-types.
     */
    constructor(private config: RetryConfig) {}

    getDelay(attempt: number): number {
        return this.config.baseDelayMs * Math.pow(2, attempt - 1);
    }
}