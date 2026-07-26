// tests/unit/RetryStrategies.test.ts
import { LinearRetry } from '../../src/strategies/LinearRetry';
import { ExponentialBackoffRetry } from '../../src/strategies/ExponentialBackoffRetry';

describe('Retry Strategies', () => {
    const config = { maxRetries: 3, baseDelayMs: 1000 };

    describe('LinearRetry', () => {
        it('debe calcular el tiempo linealmente', () => {
            const strategy = new LinearRetry(config);
            expect(strategy.getDelay(1)).toBe(1000); // 1000 * 1
            expect(strategy.getDelay(2)).toBe(2000); // 1000 * 2
            expect(strategy.getDelay(3)).toBe(3000); // 1000 * 3
        });
    });

    describe('ExponentialBackoffRetry', () => {
        it('debe calcular el tiempo exponencialmente', () => {
            const strategy = new ExponentialBackoffRetry(config);
            expect(strategy.getDelay(1)).toBe(1000); // 1000 * (2^0)
            expect(strategy.getDelay(2)).toBe(2000); // 1000 * (2^1)
            expect(strategy.getDelay(3)).toBe(4000); // 1000 * (2^2)
        });
    });
});