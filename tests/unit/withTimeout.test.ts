// tests/unit/withTimeout.test.ts
import { withTimeout, SmartFetchTimeoutError } from '../../src/aspects/withTimeout';

describe('withTimeout Middleware', () => {
    const mockRequest = new Request('https://api.example.com');

    it('debe lanzar SmartFetchTimeoutError si la peticion expira', async () => {
        const timeoutMs = 100;
        const middleware = withTimeout(timeoutMs);
        
        // Simulamos un fetch que respeta la señal de aborto (como el fetch real)
        const slowNext = jest.fn().mockImplementation((req: Request) => {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => resolve(new Response('OK')), 200);
                
                // Escuchamos si el middleware decide abortar la petición
                req.signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    const abortError = new Error('AbortError');
                    abortError.name = 'AbortError'; // Es vital que se llame así
                    reject(abortError);
                });
            });
        });

        await expect(middleware(mockRequest, slowNext)).rejects.toThrow(SmartFetchTimeoutError);
    });

    it('debe retornar la respuesta exitosamente si es mas rapida que el timeout', async () => {
        const timeoutMs = 200;
        const middleware = withTimeout(timeoutMs);
        const mockResponse = new Response('OK');
        
        // Simulamos un next() veloz
        const fastNext = jest.fn().mockResolvedValue(mockResponse);

        const result = await middleware(mockRequest, fastNext);
        expect(result).toBe(mockResponse);
    });
});