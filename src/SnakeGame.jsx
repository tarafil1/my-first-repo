import { useState, useEffect, useCallback } from 'react'

const SnakeGame = () => {
  // 📚 LEARNING: Game state management with multiple useState hooks
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]) // Snake starts with one segment
  const [food, setFood] = useState({ x: 5, y: 5 }) // Food position
  const [direction, setDirection] = useState({ x: 0, y: 0 }) // Current movement direction
  const [gameStarted, setGameStarted] = useState(false) // Has the game started?
  const [gameOver, setGameOver] = useState(false) // Is the game over?
  const [paused, setPaused] = useState(false) // Is the game paused?
  const [score, setScore] = useState(0) // Player's score
  
  // 💀 Death tracking for clear feedback
  const [deathReason, setDeathReason] = useState(null) // Why did the game end?
  const [collisionPoint, setCollisionPoint] = useState(null) // Where did the collision happen?
  
  // 🚧 NEW: Obstacles system
  const [obstacles, setObstacles] = useState([]) // Array of obstacle positions
  const [obstacleTimer, setObstacleTimer] = useState(0) // Timer for obstacle spawning
  
  // ⚡ NEW: Power-ups system
  const [powerUps, setPowerUps] = useState([]) // Array of power-up positions with types
  const [activePowerUps, setActivePowerUps] = useState([]) // Currently active power-up effects
  const [powerUpSpawnTimer, setPowerUpSpawnTimer] = useState(0) // Timer for power-up spawning

  // 🎮 Game configuration
  const BOARD_SIZE = 20 // 20x20 grid
  const GAME_SPEED = 150 // Milliseconds between moves (lower = faster)
  
  // 🚧 Obstacle configuration
  const OBSTACLE_SPAWN_CHANCE = 0.02 // 2% chance per game tick (roughly every 3-5 seconds)
  const MAX_OBSTACLES = 6 // Reduced max obstacles since they're more strategically placed
  const OBSTACLE_LIFETIME = 80 // Slightly shorter lifetime for more dynamic gameplay
  
  // ⚡ Power-up configuration
  const POWERUP_SPAWN_CHANCE = 0.015 // 1.5% chance per game tick (rarer than obstacles)
  const MAX_POWERUPS = 2 // Maximum power-ups on board at once
  const POWERUP_LIFETIME = 50 // Power-ups disappear after ~7.5 seconds (50 * 150ms)
  const POWERUP_EFFECT_DURATION = 100 // Active power-up effects last ~15 seconds
  
  // 🎯 Power-up types and their effects
  const POWERUP_TYPES = {
    SLOW_MOTION: { 
      emoji: '⏰', 
      name: 'Slow Motion', 
      color: '#2196F3',
      effect: 'gameSpeed',
      value: 0.5 // Halves the game speed (makes snake slower)
    },
    SCORE_BOOST: { 
      emoji: '💰', 
      name: 'Score Boost', 
      color: '#FFD700',
      effect: 'scoreMultiplier',
      value: 2 // Doubles score for collected food
    },
    SPEED_BOOST: { 
      emoji: '⚡', 
      name: 'Speed Boost', 
      color: '#FF4081',
      effect: 'gameSpeed',
      value: 2 // Doubles the game speed (makes snake faster)
    },
    INVINCIBILITY: { 
      emoji: '🛡️', 
      name: 'Invincibility', 
      color: '#9C27B0',
      effect: 'invincible',
      value: true // Makes snake invincible to obstacles and walls
    }
  }

  // 🍎 Generate random food position (avoiding snake and obstacles)
  const generateFood = useCallback(() => {
    let newFood
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      }
      // Make sure food doesn't spawn on snake, obstacles, or power-ups
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y) ||
      powerUps.some(powerUp => powerUp.x === newFood.x && powerUp.y === newFood.y)
    )
    
    return newFood
  }, [snake, obstacles, powerUps])

  // 🎯 Generate obstacle position targeting areas near the snake
  const generateObstacle = useCallback(() => {
    if (snake.length === 0) return null
    
    const snakeHead = snake[0]
    let newObstacle
    let attempts = 0
    const maxAttempts = 100 // More attempts for targeted placement
    
    // 🎯 CREATE CANDIDATE POSITIONS NEAR SNAKE
    const candidates = []
    
    // Generate positions in expanding rings around the snake head
    for (let ring = 3; ring <= 8; ring++) { // Start at ring 3 (2-block buffer + 1)
      for (let x = snakeHead.x - ring; x <= snakeHead.x + ring; x++) {
        for (let y = snakeHead.y - ring; y <= snakeHead.y + ring; y++) {
          // Only positions on the edge of the current ring
          if (Math.abs(x - snakeHead.x) === ring || Math.abs(y - snakeHead.y) === ring) {
            if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
              // Calculate distance from snake head
              const distance = Math.max(Math.abs(x - snakeHead.x), Math.abs(y - snakeHead.y))
              
              // Weight closer positions more heavily (inverse distance)
              const weight = ring === 3 ? 5 : ring === 4 ? 4 : ring === 5 ? 3 : ring === 6 ? 2 : 1
              
              // Add multiple copies based on weight for probability
              for (let w = 0; w < weight; w++) {
                candidates.push({ x, y, distance })
              }
            }
          }
        }
      }
    }
    
    // Shuffle candidates for randomness within weighted groups
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
    }
    
    // Try candidates in weighted random order
    for (const candidate of candidates) {
      newObstacle = {
        x: candidate.x,
        y: candidate.y,
        age: 0
      }
      
      attempts++
      if (attempts > maxAttempts) break
      
      // Check if this position is valid
      const isValidPosition = !(
        // Don't spawn on snake
        snake.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y) ||
        // Don't spawn on food
        (food.x === newObstacle.x && food.y === newObstacle.y) ||
        // Don't spawn on existing obstacles
        obstacles.some(obstacle => obstacle.x === newObstacle.x && obstacle.y === newObstacle.y) ||
        // Don't spawn on power-ups
        powerUps.some(powerUp => powerUp.x === newObstacle.x && powerUp.y === newObstacle.y) ||
        // Maintain 2-block minimum distance from snake head
        (Math.abs(snakeHead.x - newObstacle.x) <= 2 && Math.abs(snakeHead.y - newObstacle.y) <= 2) ||
        // Don't spawn too close to any part of snake body (1 block buffer)
        snake.some(segment => Math.abs(segment.x - newObstacle.x) <= 1 && Math.abs(segment.y - newObstacle.y) <= 1)
      )
      
      if (isValidPosition) {
        return newObstacle
      }
    }
    
    return null // Couldn't find valid position
  }, [snake, food, obstacles, powerUps])

  // ⚡ Generate power-up at random location (avoiding snake, food, obstacles, other power-ups)
  const generatePowerUp = useCallback(() => {
    const powerUpTypeKeys = Object.keys(POWERUP_TYPES)
    const randomType = powerUpTypeKeys[Math.floor(Math.random() * powerUpTypeKeys.length)]
    
    let newPowerUp
    let attempts = 0
    const maxAttempts = 100
    
    do {
      newPowerUp = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
        type: randomType,
        age: 0
      }
      attempts++
      
      if (attempts > maxAttempts) return null // Couldn't find valid position
      
      // Make sure power-up doesn't spawn on snake, food, obstacles, or other power-ups
    } while (
      snake.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) ||
      (food.x === newPowerUp.x && food.y === newPowerUp.y) ||
      obstacles.some(obstacle => obstacle.x === newPowerUp.x && obstacle.y === newPowerUp.y) ||
      powerUps.some(powerUp => powerUp.x === newPowerUp.x && powerUp.y === newPowerUp.y)
    )
    
    return newPowerUp
  }, [snake, food, obstacles, powerUps])

  // 🐍 Move the snake
  const moveSnake = useCallback(() => {
    if (!gameStarted || gameOver || paused || (direction.x === 0 && direction.y === 0)) {
      return
    }

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }
      
      // Calculate new head position
      head.x += direction.x
      head.y += direction.y
      
      // Check if invincibility is active
      const isInvincible = activePowerUps.some(powerUp => 
        POWERUP_TYPES[powerUp.type].effect === 'invincible'
      )
      
      // 💥 Check wall collision with specific wall detection
      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        if (!isInvincible) {
          let wallType = ''
          if (head.x < 0) wallType = 'left wall'
          else if (head.x >= BOARD_SIZE) wallType = 'right wall'
          else if (head.y < 0) wallType = 'top wall'
          else if (head.y >= BOARD_SIZE) wallType = 'bottom wall'
          
          setDeathReason(`wall-${wallType}`)
          setCollisionPoint({ x: head.x, y: head.y })
          setGameOver(true)
          return currentSnake
        } else {
          // With invincibility, wrap around the board
          if (head.x < 0) head.x = BOARD_SIZE - 1
          else if (head.x >= BOARD_SIZE) head.x = 0
          else if (head.y < 0) head.y = BOARD_SIZE - 1
          else if (head.y >= BOARD_SIZE) head.y = 0
        }
      }
      
      // 💥 Check self collision
      const selfCollision = newSnake.find(segment => segment.x === head.x && segment.y === head.y)
      if (selfCollision && !isInvincible) {
        setDeathReason('self-collision')
        setCollisionPoint({ x: head.x, y: head.y })
        setGameOver(true)
        return currentSnake
      }
      
      // 🚧 Check obstacle collision
      const obstacleCollision = obstacles.find(obstacle => obstacle.x === head.x && obstacle.y === head.y)
      if (obstacleCollision && !isInvincible) {
        setDeathReason('obstacle-collision')
        setCollisionPoint({ x: head.x, y: head.y })
        setGameOver(true)
        return currentSnake
      }
      
      newSnake.unshift(head) // Add new head
      
      // ⚡ Check if power-up was collected
      const powerUpCollected = powerUps.find(powerUp => powerUp.x === head.x && powerUp.y === head.y)
      if (powerUpCollected) {
        // Add to active power-ups
        setActivePowerUps(prev => [...prev, {
          type: powerUpCollected.type,
          timeLeft: POWERUP_EFFECT_DURATION
        }])
        
        // Remove the collected power-up
        setPowerUps(prev => prev.filter(powerUp => 
          !(powerUp.x === head.x && powerUp.y === head.y)
        ))
      }
      
      // 🍎 Check if food was eaten
      if (head.x === food.x && head.y === food.y) {
        // Calculate score with power-up multiplier
        const scoreBoostActive = activePowerUps.find(powerUp => 
          POWERUP_TYPES[powerUp.type].effect === 'scoreMultiplier'
        )
        const multiplier = scoreBoostActive ? POWERUP_TYPES[scoreBoostActive.type].value : 1
        setScore(prev => prev + (10 * multiplier)) // Increase score with multiplier
        setFood(generateFood()) // Generate new food
        // Don't remove tail (snake grows)
      } else {
        newSnake.pop() // Remove tail (snake doesn't grow)
      }
      
      return newSnake
    })

    // 🚧 Manage obstacles (aging, spawning, removal)
    setObstacles(currentObstacles => {
      let updatedObstacles = currentObstacles.map(obstacle => ({
        ...obstacle,
        age: obstacle.age + 1
      }))

      // Remove old obstacles
      updatedObstacles = updatedObstacles.filter(obstacle => obstacle.age < OBSTACLE_LIFETIME)

      // Maybe spawn new obstacle
      if (
        updatedObstacles.length < MAX_OBSTACLES &&
        Math.random() < OBSTACLE_SPAWN_CHANCE &&
        gameStarted &&
        !gameOver &&
        !paused
      ) {
        const newObstacle = generateObstacle()
        if (newObstacle) {
          updatedObstacles.push(newObstacle)
        }
      }

      return updatedObstacles
    })

    // ⚡ Manage power-ups (aging, spawning, removal)
    setPowerUps(currentPowerUps => {
      let updatedPowerUps = currentPowerUps.map(powerUp => ({
        ...powerUp,
        age: powerUp.age + 1
      }))

      // Remove old power-ups (they disappear after POWERUP_LIFETIME)
      updatedPowerUps = updatedPowerUps.filter(powerUp => powerUp.age < POWERUP_LIFETIME)

      // Maybe spawn new power-up
      if (
        updatedPowerUps.length < MAX_POWERUPS &&
        Math.random() < POWERUP_SPAWN_CHANCE &&
        gameStarted &&
        !gameOver &&
        !paused
      ) {
        const newPowerUp = generatePowerUp()
        if (newPowerUp) {
          updatedPowerUps.push(newPowerUp)
        }
      }

      return updatedPowerUps
    })

    // ⚡ Update active power-up effects (decrease their timers)
    setActivePowerUps(currentActivePowerUps => {
      return currentActivePowerUps
        .map(activePowerUp => ({
          ...activePowerUp,
          timeLeft: activePowerUp.timeLeft - 1
        }))
        .filter(activePowerUp => activePowerUp.timeLeft > 0) // Remove expired power-ups
    })
  }, [direction, food, gameStarted, gameOver, paused, generateFood, obstacles, generateObstacle, powerUps, generatePowerUp])

  // 🎮 Handle keyboard input
  const handleKeyPress = useCallback((e) => {
    if (!gameStarted || gameOver) return
    
    switch (e.key) {
      case 'ArrowUp':
        if (direction.y !== 1) setDirection({ x: 0, y: -1 })
        break
      case 'ArrowDown':
        if (direction.y !== -1) setDirection({ x: 0, y: 1 })
        break
      case 'ArrowLeft':
        if (direction.x !== 1) setDirection({ x: -1, y: 0 })
        break
      case 'ArrowRight':
        if (direction.x !== -1) setDirection({ x: 1, y: 0 })
        break
      case ' ':
        e.preventDefault()
        setPaused(prev => !prev)
        break
    }
  }, [direction, gameStarted, gameOver])

  // 🎯 Start new game
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 5, y: 5 })
    setDirection({ x: 1, y: 0 }) // Start moving right
    setGameStarted(true)
    setGameOver(false)
    setPaused(false)
    setScore(0)
    // Clear death information
    setDeathReason(null)
    setCollisionPoint(null)
    // Clear obstacles
    setObstacles([])
    setObstacleTimer(0)
    // Clear power-ups
    setPowerUps([])
    setActivePowerUps([])
    setPowerUpSpawnTimer(0)
  }

  // ⏸️ Toggle pause
  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setPaused(prev => !prev)
    }
  }

  // 💀 Get specific death message
  const getDeathMessage = () => {
    if (!deathReason) return 'Game Over!'
    
    if (deathReason.startsWith('wall-')) {
      const wall = deathReason.replace('wall-', '')
      return `💥 You hit the ${wall}!`
    } else if (deathReason === 'self-collision') {
      return `🐍 You ran into yourself!`
    } else if (deathReason === 'obstacle-collision') {
      return `🚧 You hit an obstacle!`
    }
    return 'Game Over!'
  }

  // ⚡ Calculate current game speed based on active power-ups
  const getCurrentGameSpeed = useCallback(() => {
    let currentSpeed = GAME_SPEED
    
    // Check for speed-affecting power-ups
    activePowerUps.forEach(powerUp => {
      if (POWERUP_TYPES[powerUp.type].effect === 'gameSpeed') {
        const modifier = POWERUP_TYPES[powerUp.type].value
        if (modifier < 1) {
          // Slow motion: increase interval (slower)
          currentSpeed = currentSpeed / modifier
        } else {
          // Speed boost: decrease interval (faster)
          currentSpeed = currentSpeed / modifier
        }
      }
    })
    
    return currentSpeed
  }, [activePowerUps])

  // 🔄 Game loop using useEffect
  useEffect(() => {
    const gameInterval = setInterval(moveSnake, getCurrentGameSpeed())
    return () => clearInterval(gameInterval)
  }, [moveSnake, getCurrentGameSpeed])

  // 🎮 Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // 🎨 Render individual cell
  const renderCell = (rowIndex, colIndex) => {
    const isSnakeHead = snake.length > 0 && snake[0].x === colIndex && snake[0].y === rowIndex
    const isSnakeBody = snake.slice(1).some(segment => segment.x === colIndex && segment.y === rowIndex)
    const isFood = food.x === colIndex && food.y === rowIndex
    const isObstacle = obstacles.some(obstacle => obstacle.x === colIndex && obstacle.y === rowIndex)
    const powerUp = powerUps.find(powerUp => powerUp.x === colIndex && powerUp.y === rowIndex)
    
    // 💀 Check if this is the collision point
    const isCollisionPoint = gameOver && collisionPoint && 
                           collisionPoint.x === colIndex && collisionPoint.y === rowIndex
    
    let cellClass = 'snake-cell'
    if (isCollisionPoint) {
      // 💥 Show collision point with special styling
      if (deathReason?.startsWith('wall-')) {
        cellClass += ' collision-wall'
      } else if (deathReason === 'self-collision') {
        cellClass += ' collision-self'
      } else if (deathReason === 'obstacle-collision') {
        cellClass += ' collision-obstacle'
      }
    } else if (isSnakeHead) {
      cellClass += gameOver ? ' snake-head-dead' : ' snake-head'
    } else if (isSnakeBody) {
      cellClass += ' snake-body'
    } else if (isFood) {
      cellClass += ' snake-food'
    } else if (isObstacle) {
      cellClass += ' snake-obstacle'
    } else if (powerUp) {
      cellClass += ` snake-powerup snake-powerup-${powerUp.type.toLowerCase()}`
    }
    
    return (
      <div
        key={`${rowIndex}-${colIndex}`}
        className={cellClass}
      >
        {powerUp && (
          <span className="powerup-emoji">
            {POWERUP_TYPES[powerUp.type].emoji}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="snake-game">
      {/* 🏆 Game Header */}
      <div className="snake-header">
        <h2>🐍 Snake Game</h2>
        <div className="snake-score">Score: {score}</div>
        
        {/* ⚡ Active Power-ups Display */}
        {activePowerUps.length > 0 && (
          <div className="active-powerups">
            <span className="powerups-label">Active Powers:</span>
            {activePowerUps.map((activePowerUp, index) => (
              <div key={index} className="active-powerup">
                <span className="powerup-icon">{POWERUP_TYPES[activePowerUp.type].emoji}</span>
                <span className="powerup-name">{POWERUP_TYPES[activePowerUp.type].name}</span>
                <span className="powerup-timer">({Math.ceil(activePowerUp.timeLeft / (1000 / GAME_SPEED))}s)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🎮 Game Controls */}
      <div className="snake-controls">
        <button 
          className="snake-btn start-btn" 
          onClick={startGame}
        >
          {gameStarted ? '🔄 Restart' : '🚀 Start Game'}
        </button>
        <button 
          className="snake-btn pause-btn" 
          onClick={togglePause}
          disabled={!gameStarted || gameOver}
        >
          {paused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
      </div>

      {/* 📋 Game Status Messages */}
      {gameOver && (
        <div className="snake-message game-over">
          {getDeathMessage()}<br />
          🎮 Your Score: {score}
        </div>
      )}
      
      {paused && !gameOver && (
        <div className="snake-message paused">
          ⏸️ Game Paused - Press SPACE or Resume to continue
        </div>
      )}

      {!gameStarted && (
        <div className="snake-instructions">
          <p>🎯 <strong>How to Play:</strong></p>
          <p>🔸 Use arrow keys to control the snake</p>
          <p>🔸 Eat the red food to grow and score points</p>
          <p>🔸 Avoid walls, your own tail, and gray obstacles!</p>
          <p>🔸 ⚠️ Obstacles spawn closer to you for extra challenge!</p>
          <p>🔸 🚧 They disappear after ~12 seconds - survive the pressure!</p>
          <p>🔸 ⚡ Collect power-ups for special abilities!</p>
          <p>🔸 💡 Power-ups disappear quickly - grab them fast!</p>
          <p>🔸 Press SPACE to pause/resume during the game</p>
        </div>
      )}

      {/* 🎮 Game Board */}
      <div className="snake-board">
        {Array.from({ length: BOARD_SIZE }, (_, rowIndex) =>
          Array.from({ length: BOARD_SIZE }, (_, colIndex) =>
            renderCell(rowIndex, colIndex)
          )
        )}
      </div>
    </div>
  )
}

export default SnakeGame