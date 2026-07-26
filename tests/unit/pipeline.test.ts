// tests/unit/pipeline.test.ts
import { executePipeline } from '../../src/aspects/pipeline';
import { Middleware } from '../../src/types';

describe('Interceptor Pipeline', () => {
    const mockRequest = new Request('https://api.example.com');
    const mockResponse = new Response('OK');
    const finalFetch = jest.fn().mockResolvedValue(mockResponse);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe ejecutar la funcion final si no hay middlewares', async () => {
        const result = await executePipeline(mockRequest, [], finalFetch);
        expect(result).toBe(mockResponse);
        expect(finalFetch).toHaveBeenCalledWith(mockRequest);
    });

    it('debe ejecutar los middlewares en orden', async () => {
        const order: number[] = [];
        
        const m1: Middleware = async (req, next) => {
            order.push(1);
            const res = await next(req);
            order.push(4);
            return res;
        };

        const m2: Middleware = async (req, next) => {
            order.push(2);
            const res = await next(req);
            order.push(3);
            return res;
        };

        const result = await executePipeline(mockRequest, [m1, m2], finalFetch);
        
        expect(result).toBe(mockResponse);
        expect(order).toEqual([1, 2, 3, 4]);
    });
});