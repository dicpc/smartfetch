// tests/unit/withTimeout.test.ts
import { withTimeout, SmartFetchTimeoutError } from '../../src/aspects/withTimeout';

describe('withTimeout Middleware', () => {
    const mockRequest = new Request('https://api.example.com');

    it('debe lanzar SmartFetchTimeoutError si la peticion expira', async () => {
        const timeoutMs = 100;
        const middleware = withTimeout(timeoutMs);
        
        // Simulamos un next() que tarda más que el timeout
        const slowNext = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));

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