// src/meta/configValidator.ts
import { SmartFetchConfig } from '../types';

/**
 * Error personalizado para fallos de validación en la configuración.
 */
export class ConfigValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigValidationError';
    }
}

/**
 * Utiliza Meta-programación (Proxy + Reflect) para validar la configuración en runtime.
 * Intercepta las asignaciones de propiedades para asegurar que los valores sean lógicos.
 * 
 * @param config El objeto de configuración inicial.
 * @returns Un Proxy seguro del objeto de configuración.
 */
export function validateConfig(config: SmartFetchConfig): SmartFetchConfig {
    const handler: ProxyHandler<SmartFetchConfig> = {
        // Interceptamos cualquier intento de asignar (set) un valor
        set(target, property: keyof SmartFetchConfig, value, receiver) {
            
            if (property === 'timeout') {
                if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
                    throw new ConfigValidationError(`'timeout' debe ser un número mayor a 0. Recibido: ${value}`);
                }
            }

            if (property === 'retry') {
                if (value !== undefined) {
                    if (typeof value !== 'object' || value === null) {
                        throw new ConfigValidationError(`'retry' debe ser un objeto.`);
                    }
                    if (typeof value.maxRetries !== 'number' || value.maxRetries < 0) {
                        throw new ConfigValidationError(`'retry.maxRetries' debe ser un número positivo (0 o mayor).`);
                    }
                    if (typeof value.baseDelayMs !== 'number' || value.baseDelayMs < 0) {
                        throw new ConfigValidationError(`'retry.baseDelayMs' debe ser un número positivo (0 o mayor).`);
                    }
                }
            }

            if (property === 'cache') {
                if (value !== undefined) {
                    if (typeof value !== 'object' || value === null) {
                        throw new ConfigValidationError(`'cache' debe ser un objeto.`);
                    }
                    if (typeof value.ttlMs !== 'number' || value.ttlMs <= 0) {
                        throw new ConfigValidationError(`'cache.ttlMs' debe ser un número mayor a 0.`);
                    }
                }
            }

            // Si pasa las validaciones, usamos Reflect para realizar la asignación real de forma segura
            return Reflect.set(target, property, value, receiver);
        },

        // Interceptamos la lectura (opcional, pero buena práctica con Reflect)
        get(target, property, receiver) {
            return Reflect.get(target, property, receiver);
        }
    };

    // 1. Creamos un Proxy vacío
    const proxy = new Proxy<SmartFetchConfig>({} as SmartFetchConfig, handler);

    // 2. Disparamos la validación inicial pasando las propiedades del objeto original al Proxy
    for (const [key, value] of Object.entries(config)) {
        Reflect.set(proxy, key, value);
    }

    return proxy;
}