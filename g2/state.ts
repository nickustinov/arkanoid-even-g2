import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { appendEventLog } from '../_shared/log'
import {
  COLS, PADDLE_WIDTH, PADDLE_ROW,
  BRICK_ROWS, BALL_SPEED_INIT, LIVES,
} from './layout'

export type GameState = {
  paddleX: number
  ballX: number
  ballY: number
  ballDx: number
  ballDy: number
  ballSpeed: number
  ballAttached: boolean
  bricks: boolean[][]
  score: number
  bricksDestroyed: number
  lives: number
  running: boolean
  over: boolean
  won: boolean
  highScore: number
}

export function createBricks(): boolean[][] {
  const bricks: boolean[][] = []
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks.push(new Array<boolean>(COLS).fill(true))
  }
  return bricks
}

export function attachBall(): void {
  game.ballAttached = true
  game.ballX = game.paddleX + Math.floor(PADDLE_WIDTH / 2)
  game.ballY = PADDLE_ROW - 1
  game.ballDx = 0
  game.ballDy = 0
  game.ballSpeed = BALL_SPEED_INIT
}

export function resetGame(): void {
  game.paddleX = Math.floor((COLS - PADDLE_WIDTH) / 2)
  game.bricks = createBricks()
  game.score = 0
  game.bricksDestroyed = 0
  game.lives = LIVES
  game.running = true
  game.over = false
  game.won = false
  attachBall()
}

export const game: GameState = {
  paddleX: Math.floor((COLS - PADDLE_WIDTH) / 2),
  ballX: 0,
  ballY: 0,
  ballDx: 0,
  ballDy: 0,
  ballSpeed: BALL_SPEED_INIT,
  ballAttached: true,
  bricks: createBricks(),
  score: 0,
  bricksDestroyed: 0,
  lives: LIVES,
  running: false,
  over: false,
  won: false,
  highScore: 0,
}

export async function fetchBestScore(): Promise<number> {
  appendEventLog('Score: fetching best score')
  try {
    const res = await fetch('/api/best-score')
    appendEventLog(`Score: GET status=${res.status}`)
    const data = await res.json()
    appendEventLog(`Score: GET response=${JSON.stringify(data)}`)
    const score: number = data.score ?? 0
    if (score > game.highScore) {
      game.highScore = score
    }
    return game.highScore
  } catch (err) {
    appendEventLog(`Score: GET failed: ${err}`)
    throw err
  }
}

export async function submitScore(score: number): Promise<void> {
  appendEventLog(`Score: submitting score=${score}`)
  try {
    const res = await fetch('/api/best-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
    appendEventLog(`Score: POST status=${res.status}`)
    const data = await res.json()
    appendEventLog(`Score: POST response=${JSON.stringify(data)}`)
    game.highScore = data.score ?? score
  } catch (err) {
    appendEventLog(`Score: POST failed: ${err}`)
    throw err
  }
}

export let bridge: EvenAppBridge | null = null

export function setBridge(b: EvenAppBridge): void {
  bridge = b
}
