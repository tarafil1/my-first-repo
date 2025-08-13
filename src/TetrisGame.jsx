import { useState, useEffect, useCallback } from 'react'
import './TetrisGame.css'

// 📚 LEARNING: Tetris Board Dimensions
// Modified to create a perfect square playing field
const BOARD_WIDTH = 15
const BOARD_HEIGHT = 15

// 📚 LEARNING: Tetris Pieces (Tetrominoes)
// Each piece is defined as a 2D array where 1 = filled block, 0 = empty space
// These are the 7 standard Tetris pieces
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0f0' // Cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000' // Yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a000f0' // Purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00f000' // Green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#f00000' // Red
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000f0' // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f0a000' // Orange
  }
}

// 📚 LEARNING: Helper function to create empty board
// Creates a 2D array filled with zeros (empty spaces)
const createEmptyBoard = () => {
  return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0))
}

// 📚 LEARNING: Helper function to get random piece
const getRandomPiece = () => {
  const pieces = Object.keys(TETROMINOES)
  const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
  return {
    type: randomPiece,
    shape: TETROMINOES[randomPiece].shape,
    color: TETROMINOES[randomPiece].color,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOES[randomPiece].shape[0].length / 2),
    y: 0
  }
}

function TetrisGame() {
  // 📚 LEARNING: Game State Management
  // We use multiple useState hooks to manage different aspects of the game
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // 📚 LEARNING: Check if piece placement is valid
  // This function prevents pieces from overlapping or going out of bounds
  const isValidMove = useCallback((piece, newX, newY, newShape = piece.shape) => {
    for (let y = 0; y < newShape.length; y++) {
      for (let x = 0; x < newShape[y].length; x++) {
        if (newShape[y][x] !== 0) {
          const boardX = newX + x
          const boardY = newY + y
          
          // Check boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false
          }
          
          // Check collision with existing pieces (but allow negative Y for spawning)
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return false
          }
        }
      }
    }
    return true
  }, [board])

  // 📚 LEARNING: Rotate piece 90 degrees clockwise
  const rotatePiece = (shape) => {
    const rotated = shape[0].map((_, index) => 
      shape.map(row => row[index]).reverse()
    )
    return rotated
  }

  // 📚 LEARNING: Place piece on board permanently
  const placePiece = useCallback(() => {
    if (!currentPiece) return

    const newBoard = board.map(row => [...row])
    
    // Place the current piece on the board
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x] !== 0) {
          const boardY = currentPiece.y + y
          if (boardY >= 0) {
            newBoard[boardY][currentPiece.x + x] = currentPiece.color
          }
        }
      }
    }

    setBoard(newBoard)
    
    // Check for completed lines
    const completedLines = []
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        completedLines.push(y)
      }
    }

    // Remove completed lines and add score
    if (completedLines.length > 0) {
      const boardAfterClear = newBoard.filter((_, index) => !completedLines.includes(index))
      const clearedBoard = [
        ...Array(completedLines.length).fill().map(() => Array(BOARD_WIDTH).fill(0)),
        ...boardAfterClear
      ]
      setBoard(clearedBoard)
      setScore(prev => prev + completedLines.length * 100)
    }

    // Spawn new piece
    const newPiece = getRandomPiece()
    if (!isValidMove(newPiece, newPiece.x, newPiece.y)) {
      setGameOver(true)
      return
    }
    
    setCurrentPiece(newPiece)
  }, [currentPiece, board, isValidMove])

  // 📚 LEARNING: Move piece down automatically or by player input
  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    const newY = currentPiece.y + 1
    if (isValidMove(currentPiece, currentPiece.x, newY)) {
      setCurrentPiece(prev => ({ ...prev, y: newY }))
    } else {
      placePiece()
    }
  }, [currentPiece, gameOver, isPaused, isValidMove, placePiece])

  // 📚 LEARNING: Handle player input
  const handleKeyPress = useCallback((event) => {
    if (!currentPiece || gameOver || isPaused) return

    switch (event.key) {
      case 'ArrowLeft':
        if (isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }))
        }
        break
      case 'ArrowRight':
        if (isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }))
        }
        break
      case 'ArrowDown':
        moveDown()
        break
      case ' ': // Spacebar for rotation
        event.preventDefault()
        const rotatedShape = rotatePiece(currentPiece.shape)
        if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotatedShape)) {
          setCurrentPiece(prev => ({ ...prev, shape: rotatedShape }))
        }
        break
      case 'p':
      case 'P':
        setIsPaused(prev => !prev)
        break
    }
  }, [currentPiece, gameOver, isPaused, isValidMove, moveDown, rotatePiece])

  // 📚 LEARNING: Game initialization
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(getRandomPiece())
    }
  }, [currentPiece, gameOver])

  // 📚 LEARNING: Auto-drop timer
  useEffect(() => {
    const dropInterval = setInterval(moveDown, 1000) // Drop every second
    return () => clearInterval(dropInterval)
  }, [moveDown])

  // 📚 LEARNING: Keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // 📚 LEARNING: Create display board combining placed pieces and current piece
  const getDisplayBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color
            }
          }
        }
      }
    }
    
    return displayBoard
  }

  // 📚 LEARNING: Restart game function
  const restartGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(null)
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }

  const displayBoard = getDisplayBoard()

  return (
    <div className="tetris-game">
      <div className="tetris-header">
        <h2>🧩 Tetris Game</h2>
        <div className="game-info">
          <div className="score">Score: {score}</div>
          <div className="status">
            {gameOver ? '💀 Game Over' : isPaused ? '⏸️ Paused' : '🎮 Playing'}
          </div>
        </div>
      </div>

      <div className="tetris-container">
        <div className="tetris-board">
          {displayBoard.map((row, y) => (
            <div key={y} className="tetris-row">
              {row.map((cell, x) => (
                <div
                  key={x}
                  className="tetris-cell"
                  style={{
                    backgroundColor: cell || '#222',
                    border: cell ? '1px solid #444' : '1px solid #333'
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="tetris-controls">
          <div className="control-info">
            <h3>🎮 Controls</h3>
            <ul>
              <li>← → Move left/right</li>
              <li>↓ Move down faster</li>
              <li>Spacebar: Rotate</li>
              <li>P: Pause/Resume</li>
            </ul>
          </div>

          {gameOver && (
            <button onClick={restartGame} className="restart-button">
              🔄 Play Again
            </button>
          )}
          
          {!gameOver && (
            <button onClick={() => setIsPaused(!isPaused)} className="pause-button">
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
          )}
        </div>
      </div>

      <div className="tetris-instructions">
        <p>💡 <strong>How to Play:</strong> Arrange falling pieces to form complete horizontal lines. Complete lines disappear and you earn points!</p>
      </div>
    </div>
  )
}

export default TetrisGame
