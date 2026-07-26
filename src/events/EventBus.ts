
type EventHandler<T> = (payload: T) => void


export class EventBus<TEvents extends object> {

  // Map: nombre del evento → Set de handlers registrados
  private readonly listeners = new Map<
    keyof TEvents,
    Set<EventHandler<unknown>>
  >()

  /**
   * Suscribirse a un evento.
   * El tipo del handler se infiere automáticamente según el evento.
   */
  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as EventHandler<unknown>)
    return this
  }

  /**
   * Desuscribirse de un evento.
   */
  off<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): this {
    this.listeners.get(event)?.delete(handler as EventHandler<unknown>)
    return this
  }

  /**
   * Suscripción de un único disparo: se auto-elimina después de ejecutarse.
   * Usa closure para capturar el wrapper y poder eliminarlo desde adentro.
   */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): this {
    const wrapper: EventHandler<TEvents[K]> = (payload) => {
      handler(payload)
      this.off(event, wrapper) // closure: wrapper se conoce a sí mismo
    }
    return this.on(event, wrapper)
  }

  /**
   * Emitir un evento: ejecuta todos los handlers registrados para ese evento.
   */
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    this.listeners
      .get(event)
      ?.forEach((handler) => handler(payload))
  }
}