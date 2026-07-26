import { SmartFetchClient } from '../../src/core/SmartFetchClient'

describe('SmartFetchClient', () => {

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: 'Diana' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('GET returns typed data', async () => {
    const client = new SmartFetchClient('https://api.example.com')
    const result = await client.get<{ name: string }>('/users/1')

    expect(result.status).toBe(200)
    expect(result.data.name).toBe('Diana')
  })

  it('emits request:start and request:end on success', async () => {
    const events: string[] = []
    const client = new SmartFetchClient('https://api.example.com')

    client
      .on('request:start', () => events.push('start'))
      .on('request:end',   () => events.push('end'))

    await client.get('/test')

    expect(events).toEqual(['start', 'end'])
  })

  it('POST sends body as JSON', async () => {
    const client = new SmartFetchClient('https://api.example.com')
    await client.post('/users', { name: 'Luis' })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Luis' }),
      })
    )
  })

  it('retries on 500 and succeeds on second attempt', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        new Response('', { status: 500, statusText: 'Internal Server Error' })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

    const client = new SmartFetchClient('https://api.example.com', {
      retry: { maxRetries: 1, baseDelayMs: 0 },
    })

    const result = await client.get<{ ok: boolean }>('/test')

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(result.data.ok).toBe(true)
  })

})