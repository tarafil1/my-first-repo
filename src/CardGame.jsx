import React, { useState, useEffect } from 'react';
import './CardGame.css';

// 🎴 Individual Card Component
// This represents a single card that can be flipped
const Card = ({ card, isFlipped, isMatched, onClick, isDisabled }) => {
  return (
    <div 
      className={`card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={() => !isDisabled && !isFlipped && !isMatched && onClick(card)}
    >
      {/* Card Front (face-down) - shows question mark */}
      <div className="card-front">
        <span className="card-symbol">?</span>
      </div>
      
      {/* Card Back (face-up) - shows the actual symbol */}
      <div className="card-back">
        <span className="card-symbol">{card.symbol}</span>
      </div>
    </div>
  );
};

// 🎮 Main Card Game Component
const CardGame = () => {
  // 🎯 Game State Management
  const [cards, setCards] = useState([]);           // Array of all cards
  const [flippedCards, setFlippedCards] = useState([]); // Currently flipped cards (max 2)
  const [matchedPairs, setMatchedPairs] = useState([]); // IDs of matched cards
  const [moves, setMoves] = useState(0);            // Number of moves (pairs of flips)
  const [gameWon, setGameWon] = useState(false);    // Win condition
  const [isDisabled, setIsDisabled] = useState(false); // Prevent clicks during card check

  // 🃏 Card symbols for our game (emojis are fun and visual!)
  const cardSymbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

  // 🎲 Initialize Game Function
  // Creates pairs of cards and shuffles them
  const initializeGame = () => {
    const gameCards = [];
    
    // Create pairs of cards (each symbol appears twice)
    cardSymbols.forEach((symbol, index) => {
      // First card of the pair
      gameCards.push({
        id: index * 2,      // Unique ID
        symbol: symbol,     // The emoji symbol
        pairId: index       // ID to match pairs (both cards in pair have same pairId)
      });
      
      // Second card of the pair
      gameCards.push({
        id: index * 2 + 1,
        symbol: symbol,
        pairId: index
      });
    });

    // 🔀 Shuffle the cards randomly
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    
    // Reset all game state
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameWon(false);
    setIsDisabled(false);
  };

  // 🎯 Handle Card Click
  const handleCardClick = (clickedCard) => {
    // Don't allow more than 2 cards to be flipped at once
    if (flippedCards.length === 2) return;

    // Add the clicked card to flipped cards
    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    // If this is the second card flipped, check for a match
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1); // Increment move counter
      setIsDisabled(true); // Prevent further clicks while checking

      const [firstCard, secondCard] = newFlippedCards;
      
      // ✅ Check if cards match (same pairId)
      if (firstCard.pairId === secondCard.pairId) {
        // It's a match! Add to matched pairs
        setMatchedPairs(prev => [...prev, firstCard.id, secondCard.id]);
        setFlippedCards([]); // Clear flipped cards
        setIsDisabled(false); // Re-enable clicking
      } else {
        // ❌ No match - flip cards back after delay
        setTimeout(() => {
          setFlippedCards([]); // Clear flipped cards (they'll flip back)
          setIsDisabled(false); // Re-enable clicking
        }, 1000); // 1 second delay to see the cards
      }
    }
  };

  // 🏆 Check Win Condition
  // Game is won when all cards are matched
  useEffect(() => {
    if (matchedPairs.length === cards.length && cards.length > 0) {
      setGameWon(true);
    }
  }, [matchedPairs, cards]);

  // 🎬 Initialize game when component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div className="card-game">
      {/* 📊 Game Header with Stats */}
      <div className="game-header">
        <h2>🎴 Memory Card Game</h2>
        <div className="game-stats">
          <span>Moves: {moves}</span>
          <span>Pairs Found: {matchedPairs.length / 2} / {cardSymbols.length}</span>
        </div>
        <button onClick={initializeGame} className="new-game-btn">
          🔄 New Game
        </button>
      </div>

      {/* 🏆 Win Message */}
      {gameWon && (
        <div className="win-message">
          <h3>🎉 Congratulations!</h3>
          <p>You won in {moves} moves!</p>
        </div>
      )}

      {/* 🎯 Game Board - Grid of Cards */}
      <div className="game-board">
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            isFlipped={flippedCards.some(f => f.id === card.id)}
            isMatched={matchedPairs.includes(card.id)}
            onClick={handleCardClick}
            isDisabled={isDisabled}
          />
        ))}
      </div>

      {/* 📋 Game Instructions */}
      <div className="game-instructions">
        <h4>How to Play:</h4>
        <ul>
          <li>Click on cards to flip them over</li>
          <li>Try to find matching pairs</li>
          <li>Match all pairs to win!</li>
          <li>Use as few moves as possible</li>
        </ul>
      </div>
    </div>
  );
};

export default CardGame;
