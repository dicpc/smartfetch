import * as http from 'http'
import { AddressInfo } from 'net'
import { SmartFetchBuilder } from '../../src/core/SmartFetchBuilder'

// ── Helpers ───────────────────────────────────────────────────────────────────

function startServer(
  handler: http.RequestListener
): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` })
    })
  })
}

function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) =>
    server.close((err?: Error) => (err ? reject(err) : resolve()))
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SmartFetch integration', () => {

  it('Builder → Client → GET returns parsed JSON from real server', async () => {
    const { server, baseUrl } = await startServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'hello from server' }))
    })

    try {
      const client = new SmartFetchBuilder().withBaseUrl(baseUrl).build()
      const { data, status } = await client.get<{ message: string }>('/ping')

      expect(status).toBe(200)
      expect(data.message).toBe('hello from server')
    } finally {
      await stopServer(server)
    }
  })

  it('custom headers are received by the server', async () => {
    let receivedHeader: string | undefined

    const { server, baseUrl } = await startServer((req, res) => {
      receivedHeader = req.headers['x-api-key'] as string
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })

    try {
      const client = new SmartFetchBuilder()
        .withBaseUrl(baseUrl)
        .withHeader('X-Api-Key', 'secret-123')
        .build()

      await client.get('/test')

      expect(receivedHeader).toBe('secret-123')
    } finally {
      await stopServer(server)
    }
  })

  it('POST body is received by the server', async () => {
    let receivedBody: unknown

    const { server, baseUrl } = await startServer((req, res) => {
      let raw = ''
      req.on('data', (chunk) => { raw += chunk })
      req.on('end', () => {
        receivedBody = JSON.parse(raw)
        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ created: true }))
      })
    })

    try {
      const client = new SmartFetchBuilder().withBaseUrl(baseUrl).build()
      await client.post('/users', { name: 'Diana', role: 'admin' })

      expect(receivedBody).toEqual({ name: 'Diana', role: 'admin' })
    } finally {
      await stopServer(server)
    }
  })

  it('retries against a real server and succeeds after initial failures', async () => {
    let callCount = 0

    const { server, baseUrl } = await startServer((_req, res) => {
      callCount++
      if (callCount < 3) {
        res.writeHead(500)
        res.end()
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ recovered: true }))
      }
    })

    try {
      const client = new SmartFetchBuilder()
        .withBaseUrl(baseUrl)
        .withRetry(2, 0)   // 2 reintentos, sin delay para no tardar
        .build()

      const { data } = await client.get<{ recovered: boolean }>('/test')

      expect(callCount).toBe(3)          // 1 original + 2 reintentos
      expect(data.recovered).toBe(true)
    } finally {
      await stopServer(server)
    }
  })

  it('times out when the server takes too long to respond', async () => {
    const { server, baseUrl } = await startServer((_req, res) => {
      // Responde después de 500ms, pero el cliente tiene timeout de 100ms
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ late: true }))
      }, 500)
    })

    try {
      const client = new SmartFetchBuilder()
        .withBaseUrl(baseUrl)
        .withTimeout(100)
        .build()

      await expect(client.get('/slow')).rejects.toThrow('timed out')
    } finally {
      await stopServer(server)
    }
  })

})