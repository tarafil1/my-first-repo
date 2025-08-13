import { useState } from 'react'
import './App.css'
import SnakeGame from './SnakeGame'
import TetrisGame from './TetrisGame'
import RockPaperScissors from './RockPaperScissors'
import CardGame from './CardGame'

function App() {
  // 📚 LEARNING: Tab system state management
  // We use useState to track which tab is currently active
  const [activeTab, setActiveTab] = useState('welcome') // Start with welcome tab
  
  // Counter state for the welcome tab (keeping original functionality)
  const [count, setCount] = useState(0)

  // Function to handle tab switching
  const handleTabClick = (tabName) => {
    setActiveTab(tabName)
  }

  // This function will run when the button is clicked (original functionality)
  const handleButtonClick = () => {
    setCount(count + 1)
  }

  // 🎨 RENDER DIFFERENT CONTENT BASED ON ACTIVE TAB
  const renderTabContent = () => {
    switch (activeTab) {
      case 'welcome':
        return (
          <main className="App-main">
            <div className="card">
              <h2>Interactive Counter</h2>
              <p>Try clicking the button below to see React in action:</p>
              
              {/* This button demonstrates React's reactive nature */}
              <button 
                onClick={handleButtonClick}
                className="count-button"
              >
                Count is: {count}
              </button>
              
              <p className="hint">
                Each click updates the state and re-renders the component!
              </p>
            </div>

            <div className="features">
              <h2>✨ What's Included</h2>
              <ul>
                <li>⚡ Vite for fast development</li>
                <li>⚛️ React 18 with modern hooks</li>
                <li>🎨 CSS styling ready for customization</li>
                <li>🔧 ESLint for code quality</li>
                <li>🐍 Snake Game for fun!</li>
                <li>🧩 Tetris Game</li>
                <li>🪨📄✂️ Rock Paper Scissors - NEW!</li>
                <li>🎴 Memory Card Game - NEW!</li>
              </ul>
            </div>

            <div className="next-steps">
              <h2>🚀 Next Steps</h2>
              <p>Try all four games: Snake, Tetris, Rock Paper Scissors, and the brand new Memory Card game!</p>
            </div>
          </main>
        )
      
      case 'snake':
        return <SnakeGame />
      
      case 'tetris':
        return <TetrisGame />
      
      case 'rockpaperscissors':
        return <RockPaperScissors />
      
      case 'cards':
        return <CardGame />
      
      default:
        return <div>Tab not found</div>
    }
  }

  return (
    <div className="App">
      {/* Header section with welcome message */}
      <header className="App-header">
        <h1>🎉 My React Gaming Hub!</h1>
        <p>
          Welcome to your multi-tab React application with games and interactive features!
        </p>
      </header>

      {/* 📚 LEARNING: Tab Navigation System */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'welcome' ? 'active' : ''}`}
          onClick={() => handleTabClick('welcome')}
        >
          🏠 Welcome
        </button>
        <button 
          className={`tab-button ${activeTab === 'snake' ? 'active' : ''}`}
          onClick={() => handleTabClick('snake')}
        >
          🐍 Snake Game
        </button>
        <button 
          className={`tab-button ${activeTab === 'tetris' ? 'active' : ''}`}
          onClick={() => handleTabClick('tetris')}
        >
          🧩 Tetris Game
        </button>
        <button 
          className={`tab-button ${activeTab === 'rockpaperscissors' ? 'active' : ''}`}
          onClick={() => handleTabClick('rockpaperscissors')}
        >
          🪨📄✂️ Rock Paper Scissors
        </button>
        <button 
          className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => handleTabClick('cards')}
        >
          🎴 Card Game
        </button>
      </nav>

      {/* 🎯 DYNAMIC CONTENT AREA */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default App
