// src/aspects/withTimeout.ts
import { Middleware } from '../types';

export class SmartFetchTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SmartFetchTimeoutError';
    }
}

/**
 * Decorador funcional (Advice) que inyecta un tiempo máximo de espera a la petición.
 * @param timeoutMs Tiempo en milisegundos.
 */
export function withTimeout(timeoutMs: number): Middleware {
    return async (request: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);

        // Clonamos la request para inyectar nuestra propia señal de aborto
        const reqWithSignal = new Request(request, { signal: controller.signal });

        try {
            const response = await next(reqWithSignal);
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new SmartFetchTimeoutError(`La petición expiró después de ${timeoutMs}ms`);
            }
            throw error;
        }
    };
}