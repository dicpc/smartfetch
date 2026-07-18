// src/aspects/pipeline.ts
import { Middleware } from '../types';

/**
 * Compone (Weaving) y ejecuta una lista de middlewares sobre una petición.
 * @param request La petición original.
 * @param middlewares Lista de interceptores a ejecutar.
 * @param finalFetch La función fetch base a ejecutar al final del pipeline.
 * @returns Promesa con la respuesta final.
 */
export async function executePipeline(
    request: Request,
    middlewares: Middleware[],
    finalFetch: (req: Request) => Promise<Response>
): Promise<Response> {
    let index = -1;

async function dispatch(i: number): Promise<Response> {
        if (i <= index) {
            throw new Error('next() llamado múltiples veces en un mismo middleware');
        }
        index = i;
        
        // 1. Primero verificamos si ya no hay middlewares (Join-point final)
        if (i === middlewares.length) {
            return finalFetch(request);
        }

        // 2. Extraemos el middleware de forma segura
        const middleware = middlewares[i];
        
        // 3. Validamos que exista para calmar a TypeScript (Type Guard)
        if (!middleware) {
            throw new Error(`Middleware no encontrado en el índice ${i}`);
        }

        // 4. Ejecutamos pasando el Request y la función next() recursiva
        return middleware(request, (req: Request) => dispatch(i + 1));
    }

    return dispatch(0);
}