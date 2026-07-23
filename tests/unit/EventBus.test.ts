// tests/unit/EventBus.test.ts

import { EventBus } from '../../src/events/EventBus'

// Contrato de prueba independiente de SmartFetchEvents
interface TestEvents {
  'data:received': { value: number }
  'error:occurred': { message: string }
}

describe('EventBus', () => {

  describe('on() + emit()', () => {

    it('executes the handler when the event is emitted', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.on('data:received', handler)
      bus.emit('data:received', { value: 42 })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it('executes all handlers registered for the same event', () => {
      const bus = new EventBus<TestEvents>()
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      bus.on('data:received', handler1)
      bus.on('data:received', handler2)
      bus.emit('data:received', { value: 99 })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('does not execute handlers of other events', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.on('error:occurred', handler)
      bus.emit('data:received', { value: 1 })

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not throw when emitting an event with no listeners', () => {
      const bus = new EventBus<TestEvents>()

      expect(() =>
        bus.emit('data:received', { value: 1 })
      ).not.toThrow()
    })

    it('does not register the same handler twice', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.on('data:received', handler)
      bus.on('data:received', handler) // duplicado
      bus.emit('data:received', { value: 1 })

      // Set descarta duplicados — solo se ejecuta una vez
      expect(handler).toHaveBeenCalledTimes(1)
    })

  })

  describe('off()', () => {

    it('does not execute the handler after unsubscribing', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.on('data:received', handler)
      bus.off('data:received', handler)
      bus.emit('data:received', { value: 42 })

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not throw when removing a handler that was never registered', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      expect(() =>
        bus.off('data:received', handler)
      ).not.toThrow()
    })

    it('only removes the specified handler, not others', () => {
      const bus = new EventBus<TestEvents>()
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      bus.on('data:received', handler1)
      bus.on('data:received', handler2)
      bus.off('data:received', handler1)
      bus.emit('data:received', { value: 1 })

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })

  })

  describe('once()', () => {

    it('executes the handler only once across multiple emissions', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.once('data:received', handler)
      bus.emit('data:received', { value: 1 })
      bus.emit('data:received', { value: 2 })
      bus.emit('data:received', { value: 3 })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('passes the correct payload on the single execution', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.once('data:received', handler)
      bus.emit('data:received', { value: 777 })

      expect(handler).toHaveBeenCalledWith({ value: 777 })
    })

    it('auto-removes itself after firing (closure behavior)', () => {
      const bus = new EventBus<TestEvents>()
      const handler = jest.fn()

      bus.once('data:received', handler)
      bus.emit('data:received', { value: 1 }) // dispara y se elimina
      bus.emit('data:received', { value: 2 }) // no debería ejecutar nada

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ value: 1 })
    })

  })

  describe('chaining', () => {

    it('allows chaining on() calls', () => {
      const bus = new EventBus<TestEvents>()
      const h1 = jest.fn()
      const h2 = jest.fn()

      bus.on('data:received', h1).on('error:occurred', h2)

      bus.emit('data:received', { value: 1 })
      bus.emit('error:occurred', { message: 'oops' })

      expect(h1).toHaveBeenCalledTimes(1)
      expect(h2).toHaveBeenCalledTimes(1)
    })

  })

})