// tests/unit/withRetry.test.ts
import { withRetry, SmartFetchRetryExhaustedError } from '../../src/aspects/withRetry';
import { LinearRetry } from '../../src/strategies/LinearRetry';

describe('withRetry Middleware', () => {
    const mockRequest = new Request('https://api.example.com');
    const config = { maxRetries: 2, baseDelayMs: 10, statusCodesToRetry: [500] };
    const strategy = new LinearRetry(config);

    it('debe tener exito en el primer intento si no hay errores', async () => {
        const middleware = withRetry(config, strategy);
        const mockResponse = new Response('OK', { status: 200 });
        const next = jest.fn().mockResolvedValue(mockResponse);

        const result = await middleware(mockRequest, next);
        expect(result).toBe(mockResponse);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('debe tener exito en el segundo intento (Retry exitoso)', async () => {
        const middleware = withRetry(config, strategy);
        const successResponse = new Response('OK', { status: 200 });
        
        const next = jest.fn()
            .mockRejectedValueOnce(new TypeError('Network error'))
            .mockResolvedValueOnce(successResponse);

        const result = await middleware(mockRequest, next);
        expect(result).toBe(successResponse);
        expect(next).toHaveBeenCalledTimes(2);
    });

    it('debe agotar los intentos y lanzar SmartFetchRetryExhaustedError', async () => {
        const middleware = withRetry(config, strategy);
        const next = jest.fn().mockRejectedValue(new TypeError('Network error'));

        // Se llama 1 vez inicial + 2 reintentos = 3 llamadas totales
        await expect(middleware(mockRequest, next)).rejects.toThrow(SmartFetchRetryExhaustedError);
        expect(next).toHaveBeenCalledTimes(3); 
    });

    it('debe reintentar si recibe un status code de la lista (ej. 500)', async () => {
        const middleware = withRetry(config, strategy);
        const errorResponse = new Response('Server Error', { status: 500 });
        const successResponse = new Response('OK', { status: 200 });
        
        const next = jest.fn()
            .mockResolvedValueOnce(errorResponse)
            .mockResolvedValueOnce(successResponse);

        const result = await middleware(mockRequest, next);
        expect(result).toBe(successResponse);
        expect(next).toHaveBeenCalledTimes(2);
    });
});