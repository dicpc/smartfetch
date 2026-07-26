// example.ts
// Full usage example of the SmartFetch library

import { SmartFetchBuilder } from './src/core/SmartFetchBuilder.js'

// ── Tipos de ejemplo ──────────────────────────────────────────────────────────

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

interface NewPost {
  title: string
  body: string
  userId: number
}

// ── Construcción del cliente con Builder ──────────────────────────────────────
// [Builder pattern] Fluent API to configure the client step by step

const client = new SmartFetchBuilder()
  .withBaseUrl('https://jsonplaceholder.typicode.com')
  .withTimeout(5_000)
  .withRetry(2, 1_000)
  .withHeader('Content-Type', 'application/json')
  .build()

// ── Suscripción a eventos del ciclo de vida ───────────────────────────────────
// [Observer pattern] React to lifecycle events without modifying the client

client
  .on('request:start', ({ url, method }) => {
    console.log(`→ [${method}] ${url}`)
  })
  .on('request:end', ({ status, url }) => {
    console.log(`✓ ${status} ${url}`)
  })
  .on('retry', ({ attempt, url }) => {
    console.warn(`⟳ Retry #${attempt} → ${url}`)
  })
  .on('timeout', ({ url, timeoutMs }) => {
    console.error(`✗ Timeout after ${timeoutMs}ms → ${url}`)
  })

// ── Función principal ─────────────────────────────────────────────────────────

async function main(): Promise<void> {

  // GET — async/await
  console.log('\n── GET ──')
  const { data: post } = await client.get<Post>('/posts/1')
  console.log('Title:', post.title)

  // GET — .then()/.catch() (API dual)
  console.log('\n── GET with .then() ──')
  await client.get<Post[]>('/posts')
    .then(({ data }) => console.log('Total posts:', data.length))
    .catch((err: Error) => console.error('Error:', err.message))

  // POST
  console.log('\n── POST ──')
  const { data: created } = await client.post<Post>('/posts', {
    title: 'SmartFetch rocks',
    body: 'A typed fetch wrapper with retry and timeout.',
    userId: 1,
  } satisfies NewPost)
  console.log('Created post id:', created.id)

  // PUT
  console.log('\n── PUT ──')
  const { data: updated } = await client.put<Post>('/posts/1', {
    title: 'Updated title',
    body: 'Updated body.',
    userId: 1,
  })
  console.log('Updated title:', updated.title)

  // PATCH
  console.log('\n── PATCH ──')
  const { data: patched } = await client.patch<Post>('/posts/1', {
    title: 'Patched title',
  })
  console.log('Patched title:', patched.title)

  // DELETE
  console.log('\n── DELETE ──')
  await client.delete('/posts/1')
  console.log('Post deleted successfully')
}

main().catch(console.error)