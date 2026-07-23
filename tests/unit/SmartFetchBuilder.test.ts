import { SmartFetchBuilder } from '../../src/core/SmartFetchBuilder'
import { SmartFetchClient } from '../../src/core/SmartFetchClient'

describe('SmartFetchBuilder', () => {

  it('build() returns a SmartFetchClient instance', () => {
    const client = new SmartFetchBuilder().build()
    expect(client).toBeInstanceOf(SmartFetchClient)
  })

  it('build() returns a new instance each call', () => {
    const builder = new SmartFetchBuilder().withBaseUrl('https://api.example.com')
    expect(builder.build()).not.toBe(builder.build())
  })

  it('allows chaining all methods', () => {
    expect(() =>
      new SmartFetchBuilder()
        .withBaseUrl('https://api.example.com')
        .withTimeout(3_000)
        .withRetry(2, 500)
        .withHeader('Authorization', 'Bearer token')
        .withHeader('X-Api-Key', '123')
        .build()
    ).not.toThrow()
  })

  it('withRetry uses default values when not provided', () => {
    expect(() =>
      new SmartFetchBuilder().withRetry(1).build()
    ).not.toThrow()
  })

})