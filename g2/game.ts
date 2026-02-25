import {
  COLS, PADDLE_WIDTH, PADDLE_ROW,
  BRICK_START_ROW, BRICK_ROWS,
  BALL_SPEED_INC, BRICKS_PER_SPEED_BUMP, BALL_SPEED_MAX, MIN_DX,
} from './layout'
import { game, attachBall } from './state'

export function movePaddleLeft(): void {
  if (!game.running) return
  game.paddleX = Math.max(0, game.paddleX - 2)
  if (game.ballAttached) {
    game.ballX = game.paddleX + Math.floor(PADDLE_WIDTH / 2)
  }
}

export function movePaddleRight(): void {
  if (!game.running) return
  game.paddleX = Math.min(COLS - PADDLE_WIDTH, game.paddleX + 2)
  if (game.ballAttached) {
    game.ballX = game.paddleX + Math.floor(PADDLE_WIDTH / 2)
  }
}

export function launch(): void {
  if (!game.ballAttached) return
  game.ballAttached = false
  // Launch at ~60° upward angle
  game.ballDx = 0.5
  game.ballDy = -0.866
}

function clampDx(): void {
  if (game.ballDx !== 0 && Math.abs(game.ballDx) < MIN_DX) {
    game.ballDx = Math.sign(game.ballDx) * MIN_DX
    // Re-normalize so dx² + dy² = 1
    const len = Math.sqrt(game.ballDx * game.ballDx + game.ballDy * game.ballDy)
    game.ballDx /= len
    game.ballDy /= len
  }
}

export function tick(): void {
  if (!game.running || game.ballAttached) return

  game.ballX += game.ballDx * game.ballSpeed
  game.ballY += game.ballDy * game.ballSpeed

  // Bounce off left wall
  if (game.ballX < 0) {
    game.ballX = -game.ballX
    game.ballDx = Math.abs(game.ballDx)
  }

  // Bounce off right wall
  if (game.ballX > COLS - 1) {
    game.ballX = 2 * (COLS - 1) - game.ballX
    game.ballDx = -Math.abs(game.ballDx)
  }

  // Bounce off top wall
  if (game.ballY < 0) {
    game.ballY = -game.ballY
    game.ballDy = Math.abs(game.ballDy)
  }

  // Paddle collision
  if (
    game.ballDy > 0 &&
    game.ballY >= PADDLE_ROW - 1 &&
    game.ballX >= game.paddleX - 0.5 &&
    game.ballX <= game.paddleX + PADDLE_WIDTH - 0.5
  ) {
    game.ballY = PADDLE_ROW - 1
    // Deflection angle based on hit position (-60° to +60°)
    const hitPos = (game.ballX - game.paddleX) / PADDLE_WIDTH
    const angle = (hitPos - 0.5) * (Math.PI / 3) * 2  // -60° to +60°
    game.ballDx = Math.sin(angle)
    game.ballDy = -Math.cos(angle)
    clampDx()
    return
  }

  // Ball below paddle = lose a life
  if (game.ballY > PADDLE_ROW) {
    game.lives--
    if (game.lives <= 0) {
      game.running = false
      game.over = true
      game.won = false
      return
    }
    attachBall()
    return
  }

  // Brick collision
  const ballCol = Math.round(game.ballX)
  const ballRow = Math.round(game.ballY)

  if (
    ballRow >= BRICK_START_ROW &&
    ballRow < BRICK_START_ROW + BRICK_ROWS &&
    ballCol >= 0 &&
    ballCol < COLS
  ) {
    const brickRow = ballRow - BRICK_START_ROW
    if (game.bricks[brickRow][ballCol]) {
      game.bricks[brickRow][ballCol] = false
      game.score++
      game.bricksDestroyed++

      // Speed increase every N bricks
      if (game.bricksDestroyed % BRICKS_PER_SPEED_BUMP === 0) {
        game.ballSpeed = Math.min(BALL_SPEED_MAX, game.ballSpeed + BALL_SPEED_INC)
      }

      // Determine bounce direction based on approach
      const prevX = game.ballX - game.ballDx * game.ballSpeed
      const prevY = game.ballY - game.ballDy * game.ballSpeed
      const prevCol = Math.round(prevX)
      const prevRow = Math.round(prevY)

      if (prevCol !== ballCol && prevRow !== ballRow) {
        // Corner hit – reverse both
        game.ballDx = -game.ballDx
        game.ballDy = -game.ballDy
      } else if (prevRow !== ballRow) {
        // Approached vertically
        game.ballDy = -game.ballDy
      } else {
        // Approached horizontally
        game.ballDx = -game.ballDx
      }

      // Check win
      const allCleared = game.bricks.every((row) => row.every((b) => !b))
      if (allCleared) {
        game.running = false
        game.over = true
        game.won = true
      }
    }
  }
}
