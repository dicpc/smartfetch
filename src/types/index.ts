/**
 * Tipos funcionales para el sistema de interceptores y AOP (Aspect-Oriented Programming).
 */
export type RequestInterceptor = (request: Request) => Promise<Request> | Request;
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

/**
 * Tipo funcional para los Middlewares del Pipeline.
 */
export type Middleware = (request: Request, next: (req: Request) => Promise<Response>) => Promise<Response>;

/**
 * Interfaz genérica para la respuesta de SmartFetch.
 * @template T - El tipo esperado de los datos de respuesta.
 */
export interface SmartFetchResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
}

/**
 * Configuración para la estrategia de reintentos.
 */
export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    statusCodesToRetry?: number[];
}

/**
 * Configuración para el sistema de caché.
 */
export interface CacheConfig {
    ttlMs: number; // Time to live en milisegundos
}

/**
 * Configuración global o específica por petición para SmartFetch.
 * Extiende RequestInit nativo de fetch.
 */
export interface SmartFetchConfig extends Omit<RequestInit, 'signal' | 'cache'> {
    timeout?: number;
    retry?: RetryConfig;
    cache?: CacheConfig;
    // Permitimos pasar un AbortSignal propio opcionalmente
    signal?: AbortSignal; 
}

/**
 * Mapeo estricto de eventos para el EventBus (Observer Pattern).
 */
export interface SmartFetchEvents {
    'request:start': { url: string; method: string };
    'request:end': { url: string; method: string; status: number };
    'retry': { url: string; attempt: number; error: Error };
    'timeout': { url: string; timeoutMs: number };
    'cache:hit': { url: string };
}

/**
 * Interfaz base (Strategy Pattern) que todas las estrategias de reintento deben implementar.
 */
export interface RetryStrategy {
    /**
     * Ejecuta una función asíncrona aplicando una política de reintentos.
     * @template T - El tipo de retorno de la función.
     * @param fn - La función a ejecutar (generalmente la llamada a fetch).
     * @returns Promesa con el resultado de la función.
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
}