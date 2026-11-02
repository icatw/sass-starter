#!/usr/bin/env node

import { loadWebEnv } from '../../apps/web/lib/env.ts'

try {
  const env = loadWebEnv()
  console.log(`OK   web env: APP_ENV=${env.appEnv} authURL=${env.authURL} api=${env.apiInternalURL}`)
} catch (error) {
  console.error(`MISS web env: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
