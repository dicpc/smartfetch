// src/strategies/RetryStrategy.ts

/**
 * Interfaz base para las políticas de reintento (Strategy Pattern).
 */
export interface RetryStrategy {
    /**
     * Calcula el tiempo de espera antes del siguiente intento.
     * @param attempt El número de intento actual (1, 2, 3...).
     * @returns El tiempo de espera en milisegundos.
     */
    getDelay(attempt: number): number;
}