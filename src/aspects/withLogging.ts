// src/aspects/withLogging.ts
import { Middleware } from '../types';

/**
 * Middleware funcional (Advice) que registra el tiempo de inicio y fin de una petición.
 */
export const withLogging: Middleware = async (request: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
    console.log(`[SmartFetch] -> ${request.method} ${request.url}`);
    const start = Date.now();
    
    try {
        const response = await next(request);
        const duration = Date.now() - start;
        console.log(`[SmartFetch] <- ${response.status} ${response.url} (${duration}ms)`);
        return response;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`[SmartFetch] x- Error en ${request.url} (${duration}ms):`, error);
        throw error;
    }
};