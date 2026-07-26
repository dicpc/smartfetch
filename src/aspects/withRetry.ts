// src/aspects/withRetry.ts
import { Middleware, RetryConfig } from '../types';
import { RetryStrategy } from '../strategies/RetryStrategy';

export class SmartFetchRetryExhaustedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SmartFetchRetryExhaustedError';
    }
}

/**
 * Decorador funcional (Advice) que implementa un bucle asíncrono para reintentos.
 * @param config Configuración de reintentos (scope/closure).
 * @param strategy Instancia de la estrategia de tiempos (Point-cut).
 */
export function withRetry(config: RetryConfig, strategy: RetryStrategy): Middleware {
    return async (request: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
        let attempt = 1;
        const statusCodesToRetry = config.statusCodesToRetry || [500, 502, 503, 504];
        
        while (true) {
            try {
                // Clonar la request es vital porque fetch consume el body al enviarlo
                const reqClone = request.clone();
                const response = await next(reqClone);
                
                // Point-cut: Decidimos si debemos interceptar y reintentar basado en el status
                if (statusCodesToRetry.includes(response.status) && attempt <= config.maxRetries) {
                    throw new Error(`HTTP Status ${response.status}`);
                }
                
                return response; // Respuesta exitosa
            } catch (error) {
                if (attempt > config.maxRetries) {
                    const lastError = error instanceof Error ? error.message : 'Error desconocido';
                    throw new SmartFetchRetryExhaustedError(`Se agotaron los ${config.maxRetries} intentos. Último error: ${lastError}`);
                }
                
                // Aplicamos la estrategia para pausar la ejecución (bucle asíncrono)
                const delay = strategy.getDelay(attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }
    };
}