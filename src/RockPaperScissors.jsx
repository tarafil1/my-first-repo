import { useState } from 'react'
import './RockPaperScissors.css'

// 📚 LEARNING: Rock Paper Scissors Game Component
// This component demonstrates:
// - State management with multiple pieces of data
// - Event handling for user interactions
// - Conditional rendering based on game state
// - Game logic implementation

function RockPaperScissors() {
  // 🎯 STATE MANAGEMENT
  // We need to track several pieces of information:
  const [playerChoice, setPlayerChoice] = useState(null)     // What player chose
  const [computerChoice, setComputerChoice] = useState(null) // What computer chose
  const [result, setResult] = useState(null)                // Who won this round
  const [score, setScore] = useState({ player: 0, computer: 0 }) // Overall score
  const [gameHistory, setGameHistory] = useState([])         // History of games
  
  // 🎲 GAME CHOICES
  // Each choice has an emoji and name for display
  const choices = [
    { id: 'rock', name: 'Rock', emoji: '🪨' },
    { id: 'paper', name: 'Paper', emoji: '📄' },
    { id: 'scissors', name: 'Scissors', emoji: '✂️' }
  ]
  
  // 🤖 COMPUTER CHOICE GENERATOR
  // This function randomly selects the computer's choice
  const getComputerChoice = () => {
    const randomIndex = Math.floor(Math.random() * choices.length)
    return choices[randomIndex]
  }
  
  // 🏆 GAME LOGIC - WHO WINS?
  // This function determines the winner based on classic rules
  const determineWinner = (playerChoice, computerChoice) => {
    // It's a tie if both chose the same thing
    if (playerChoice.id === computerChoice.id) {
      return 'tie'
    }
    
    // Rock beats Scissors, Scissors beats Paper, Paper beats Rock
    const winningCombos = {
      rock: 'scissors',
      scissors: 'paper', 
      paper: 'rock'
    }
    
    // Check if player's choice beats computer's choice
    if (winningCombos[playerChoice.id] === computerChoice.id) {
      return 'player'
    } else {
      return 'computer'
    }
  }
  
  // 🎮 MAIN GAME FUNCTION
  // This runs when player makes a choice
  const playGame = (playerSelectedChoice) => {
    // Get computer's random choice
    const computerSelectedChoice = getComputerChoice()
    
    // Determine who won
    const gameResult = determineWinner(playerSelectedChoice, computerSelectedChoice)
    
    // Update all our state with the results
    setPlayerChoice(playerSelectedChoice)
    setComputerChoice(computerSelectedChoice)
    setResult(gameResult)
    
    // Update the score based on who won
    if (gameResult === 'player') {
      setScore(prev => ({ ...prev, player: prev.player + 1 }))
    } else if (gameResult === 'computer') {
      setScore(prev => ({ ...prev, computer: prev.computer + 1 }))
    }
    
    // Add this game to our history (keep last 5 games)
    setGameHistory(prev => [
      { playerChoice: playerSelectedChoice, computerChoice: computerSelectedChoice, result: gameResult },
      ...prev.slice(0, 4)
    ])
  }
  
  // 🔄 RESET GAME FUNCTION
  const resetGame = () => {
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
    setScore({ player: 0, computer: 0 })
    setGameHistory([])
  }
  
  // 📊 RESULT DISPLAY HELPER
  const getResultMessage = () => {
    if (!result) return "Make your choice!"
    
    switch (result) {
      case 'player':
        return "🎉 You Win!"
      case 'computer':
        return "🤖 Computer Wins!"
      case 'tie':
        return "🤝 It's a Tie!"
      default:
        return ""
    }
  }
  
  return (
    <div className="rock-paper-scissors">
      {/* 🏠 GAME HEADER */}
      <div className="game-header">
        <h1>🪨📄✂️ Rock Paper Scissors</h1>
        <p>Choose your weapon and battle the computer!</p>
      </div>
      
      {/* 📊 SCOREBOARD */}
      <div className="scoreboard">
        <div className="score-item">
          <span className="score-label">You</span>
          <span className="score-value">{score.player}</span>
        </div>
        <div className="score-divider">VS</div>
        <div className="score-item">
          <span className="score-label">Computer</span>
          <span className="score-value">{score.computer}</span>
        </div>
      </div>
      
      {/* 🎯 GAME CHOICES */}
      <div className="choices-section">
        <h3>Make Your Choice:</h3>
        <div className="choices-grid">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className={`choice-button ${playerChoice?.id === choice.id ? 'selected' : ''}`}
              onClick={() => playGame(choice)}
            >
              <span className="choice-emoji">{choice.emoji}</span>
              <span className="choice-name">{choice.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 🎪 BATTLE ARENA - Shows current game result */}
      {playerChoice && computerChoice && (
        <div className="battle-arena">
          <div className="battle-header">
            <h3>{getResultMessage()}</h3>
          </div>
          
          <div className="battle-display">
            <div className="player-section">
              <h4>You Chose:</h4>
              <div className="choice-display">
                <span className="battle-emoji">{playerChoice.emoji}</span>
                <span className="battle-name">{playerChoice.name}</span>
              </div>
            </div>
            
            <div className="vs-section">
              <span className="vs-text">VS</span>
            </div>
            
            <div className="computer-section">
              <h4>Computer Chose:</h4>
              <div className="choice-display">
                <span className="battle-emoji">{computerChoice.emoji}</span>
                <span className="battle-name">{computerChoice.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 📚 GAME HISTORY */}
      {gameHistory.length > 0 && (
        <div className="game-history">
          <h3>Recent Games:</h3>
          <div className="history-list">
            {gameHistory.map((game, index) => (
              <div key={index} className={`history-item ${game.result}`}>
                <span className="history-choices">
                  {game.playerChoice.emoji} vs {game.computerChoice.emoji}
                </span>
                <span className="history-result">
                  {game.result === 'player' ? 'You Won!' : 
                   game.result === 'computer' ? 'Computer Won' : 'Tie'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 🔄 RESET BUTTON */}
      <div className="game-controls">
        <button className="reset-button" onClick={resetGame}>
          🔄 Reset Game
        </button>
      </div>
      
      {/* 📖 GAME RULES */}
      <div className="game-rules">
        <h4>📋 Rules:</h4>
        <ul>
          <li>🪨 Rock beats ✂️ Scissors</li>
          <li>✂️ Scissors beats 📄 Paper</li>
          <li>📄 Paper beats 🪨 Rock</li>
        </ul>
      </div>
    </div>
  )
}

export default RockPaperScissors
