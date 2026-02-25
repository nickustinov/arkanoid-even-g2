import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import type { AppActions, SetStatus } from '../_shared/app-types'
import { appendEventLog } from '../_shared/log'
import { initApp, startGame } from './app'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Even bridge not detected within ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer))
  })
}

export function createArkanoidActions(setStatus: SetStatus): AppActions {
  let connected = false

  return {
    async connect() {
      setStatus('Arkanoid: connecting to Even bridge...')
      appendEventLog('Arkanoid: connect requested')

      try {
        const bridge = await withTimeout(waitForEvenAppBridge(), 6000)
        await initApp(bridge)
        connected = true
        setStatus('Arkanoid: connected. Tap to start!')
        appendEventLog('Arkanoid: connected to bridge')
      } catch (err) {
        console.error('[arkanoid] connect failed', err)
        setStatus('Arkanoid: bridge not found.')
        appendEventLog('Arkanoid: connection failed')
      }
    },

    async action() {
      if (!connected) {
        setStatus('Arkanoid: not connected')
        return
      }
      startGame()
      setStatus('Arkanoid: new game!')
    },
  }
}
