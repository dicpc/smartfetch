// src/strategies/LinearRetry.ts
import { RetryStrategy } from './RetryStrategy';
import { RetryConfig } from '../types';

/**
 * Estrategia de reintento lineal. El tiempo de espera crece proporcionalmente al intento.
 */
export class LinearRetry implements RetryStrategy {
    /**
     * @param config Configuración de reintentos importada de core-types.
     */
    constructor(private config: RetryConfig) {}

    getDelay(attempt: number): number {
        return this.config.baseDelayMs * attempt;
    }
}