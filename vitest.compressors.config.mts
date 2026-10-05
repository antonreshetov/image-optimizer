import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/main/**/*.integration.ts'],
    testTimeout: 20000
  }
})
