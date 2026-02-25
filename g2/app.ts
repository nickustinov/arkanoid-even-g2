import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { appendEventLog } from '../_shared/log'
import { TICK_MS } from './layout'
import { game, setBridge, resetGame, fetchBestScore, submitScore } from './state'
import { tick } from './game'
import { initDisplay, pushFrame, showSplash } from './renderer'
import { onEvenHubEvent, setStartGame } from './events'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function gameLoop(): Promise<void> {
  appendEventLog('Arkanoid: game loop started')
  while (game.running) {
    const start = Date.now()

    tick()
    await pushFrame()

    const elapsed = Date.now() - start
    await sleep(Math.max(0, TICK_MS - elapsed))
  }

  if (game.over) {
    await submitScore(game.score)
    await pushFrame()
    appendEventLog(`Arkanoid: game over, score=${game.score}, won=${game.won}`)
  }
}

export function startGame(): void {
  if (game.running) return
  if (game.over) {
    game.over = false
    void showSplash()
    appendEventLog('Arkanoid: back to splash')
    return
  }
  resetGame()
  void pushFrame().then(() => {
    void gameLoop()
  })
  appendEventLog('Arkanoid: new game started')
}

export async function initApp(appBridge: EvenAppBridge): Promise<void> {
  setBridge(appBridge)
  setStartGame(startGame)

  appBridge.onEvenHubEvent((event) => {
    onEvenHubEvent(event)
  })

  await initDisplay()

  fetchBestScore().then(() => {
    appendEventLog(`Score: fetched, highScore=${game.highScore}`)
    if (!game.running) void pushFrame()
  }).catch((err) => {
    appendEventLog(`Score: fetch failed: ${err}`)
  })

  appendEventLog('Arkanoid: ready. Tap to start.')
}
