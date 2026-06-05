import { useEffect, useMemo, useRef, useState } from 'react';
import {
    applyMove,
    chooseAIMove,
    createInitialBoard,
    getGameStatus,
    getLegalMoves,
    indexToCoords,
} from './checkers.js';

function opponent(color) {
    return color === 'red' ? 'black' : 'red';
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function pieceLabel(piece) {
    if (!piece) {
          return 'empty';
    }

  return `${piece.color} ${piece.king ? 'king' : 'piece'}`;
}

function squareClassName(index, selected, destination, activeDestination, playable) {
    const { row, col } = indexToCoords(index);
    const isDark = (row + col) % 2 === 1;
    const classes = ['square', isDark ? 'dark' : 'light'];
    if (selected) {
          classes.push('selected');
    }
    if (destination) {
          classes.push('destination');
    }
    if (activeDestination) {
          classes.push('active-destination');
    }
    if (playable) {
          classes.push('playable');
    }
    return classes.join(' ');
}

function Piece({ piece }) {
    if (!piece) {
          return null;
    }

  return (
        <span className={`piece ${piece.color}${piece.king ? ' king' : ''}`} aria-hidden="true">
          {piece.king ? 'K' : 'o'}
        </span>span>
      );
}

export function CheckersGame() {
    const [board, setBoard] = useState(() => createInitialBoard());
    const [currentPlayer, setCurrentPlayer] = useState('red');
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedMoveIndex, setSelectedMoveIndex] = useState(0);
    const [winner, setWinner] = useState(null);
    const [history, setHistory] = useState([]);
    const [mode, setMode] = useState('two-player');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const squareRefs = useRef([]);
  
    const currentStatus = useMemo(
          () => (winner ? { winner, reason: `${winner} wins the match` } : getGameStatus(board, currentPlayer)),
          [board, currentPlayer, winner],
        );
  
    const legalMoves = useMemo(() => {
          if (currentStatus.winner) {
                  return [];
          }
          return getLegalMoves(board, currentPlayer);
    }, [board, currentPlayer, currentStatus.winner]);
  
    const selectedMoves = useMemo(() => {
          if (selectedIndex === null) {
                  return [];
          }
          return legalMoves.filter((move) => move.from === selectedIndex);
    }, [legalMoves, selectedIndex]);
  
    const activeMove = selectedMoves[selectedMoveIndex] ?? null;
    const destinationSquares = useMemo(
          () => new Set(selectedMoves.map((move) => move.to)),
          [selectedMoves],
        );
  
    const turnLabel = capitalize(currentPlayer);
    const winnerLabel = winner ? capitalize(winner) : null;
    const isAiMode = mode === 'ai';
    const humanTurn = !isAiMode || currentPlayer === 'red';
  
    function resetGame() {
          setBoard(createInitialBoard());
          setCurrentPlayer('red');
          setSelectedIndex(null);
          setSelectedMoveIndex(0);
          setWinner(null);
          setHistory([]);
          setDraggedIndex(null);
    }
  
    function focusSquare(index) {
          squareRefs.current[index]?.focus();
    }
  
    function commitMove(move, moverColor = currentPlayer) {
          const nextBoard = applyMove(board, move);
          const nextPlayer = opponent(moverColor);
          const nextStatus = getGameStatus(nextBoard, nextPlayer);
          const actor = isAiMode && moverColor === 'black' ? 'Black (AI)' : capitalize(moverColor);
      
          setBoard(nextBoard);
          setCurrentPlayer(nextPlayer);
          setSelectedIndex(null);
          setSelectedMoveIndex(0);
          setDraggedIndex(null);
          setHistory((entries) => [...entries, `${actor} moved from ${move.from} to ${move.to}`]);
      
          if (nextStatus.winner) {
                  setWinner(nextStatus.winner);
          }
    }
  
    function selectPiece(index) {
          setSelectedIndex(index);
          setSelectedMoveIndex(0);
    }
  
    function moveSelection(delta) {
          if (selectedMoves.length === 0) {
                  return;
          }
      
          setSelectedMoveIndex((current) => {
                  const next = (current + delta + selectedMoves.length) % selectedMoves.length;
                  return next;
          });
    }
  
    function tryCommitSelectedMove() {
          if (activeMove) {
                  commitMove(activeMove);
          }
    }
  
    function handleSquareClick(index) {
          if (!humanTurn || currentStatus.winner) {
                  return;
          }
      
          const piece = board[index];
          const chosenMove = selectedIndex !== null ? selectedMoves.find((move) => move.to === index) : null;
      
          if (chosenMove) {
                  commitMove(chosenMove);
                  return;
          }
      
          if (piece && piece.color === currentPlayer && legalMoves.some((move) => move.from === index)) {
                  selectPiece(index);
                  return;
          }
      
          setSelectedIndex(null);
          setSelectedMoveIndex(0);
    }
  
    function handleSquareKeyDown(index, event) {
          if (currentStatus.winner) {
                  return;
          }
      
          if (selectedIndex !== null) {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                            event.preventDefault();
                            moveSelection(1);
                            return;
                  }
            
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                            event.preventDefault();
                            moveSelection(-1);
                            return;
                  }
            
                  if (event.key === 'Home') {
                            event.preventDefault();
                            setSelectedMoveIndex(0);
                            return;
                  }
            
                  if (event.key === 'End') {
                            event.preventDefault();
                            setSelectedMoveIndex(Math.max(selectedMoves.length - 1, 0));
                            return;
                  }
            
                  if (event.key === 'Escape') {
                            event.preventDefault();
                            setSelectedIndex(null);
                            setSelectedMoveIndex(0);
                            return;
                  }
            
                  if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            tryCommitSelectedMove();
                            return;
                  }
          }
      
          if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  focusSquare(Math.min(index + 1, 63));
                  return;
          }
      
          if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  focusSquare(Math.max(index - 1, 0));
                  return;
          }
      
          if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  focusSquare(Math.min(index + 8, 63));
                  return;
          }
      
          if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  focusSquare(Math.max(index - 8, 0));
          }
    }
  
    function handleDragStart(index, event) {
          if (!humanTurn || currentStatus.winner) {
                  event.preventDefault();
                  return;
          }
      
          const piece = board[index];
          if (!piece || piece.color !== currentPlayer) {
                  event.preventDefault();
                  return;
          }
      
          event.dataTransfer.setData('text/plain', String(index));
          event.dataTransfer.effectAllowed = 'move';
          setDraggedIndex(index);
          selectPiece(index);
    }
  
    function handleDrop(index, event) {
          event.preventDefault();
          if (!humanTurn || currentStatus.winner) {
                  return;
          }
      
          const sourceIndex = draggedIndex ?? Number(event.dataTransfer.getData('text/plain'));
          if (Number.isNaN(sourceIndex)) {
                  return;
          }
      
          const move = getLegalMoves(board, currentPlayer).find(
                  (candidate) => candidate.from === sourceIndex && candidate.to === index,
                );
          if (move) {
                  commitMove(move);
          }
    }
  
    function handleDragOver(event) {
          if (humanTurn && !currentStatus.winner) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
          }
    }
  
    useEffect(() => {
          if (winner || !isAiMode || currentPlayer !== 'black' || currentStatus.winner) {
                  return undefined;
          }
      
          const timer = setTimeout(() => {
                  const move = chooseAIMove(board, 'black');
                  if (move) {
                            commitMove(move, 'black');
                  }
          }, 400);
      
          return () => clearTimeout(timer);
    }, [board, currentPlayer, currentStatus.winner, isAiMode, winner]);
  
    useEffect(() => {
          if (!winner && currentStatus.winner) {
                  setWinner(currentStatus.winner);
          }
    }, [currentStatus.winner, winner]);
  
    return (
          <main className="game-shell">
                <section className="hero">
                        <div>
                                  <p className="eyebrow">Web Checkers</p>p>
                                  <h1>Two players, one board, no hidden rules.</h1>h1>
                        </div>div>
                        <div className="status-card">
                                  <p className="status-label">{winnerLabel ? 'Winner' : 'Turn'}</p>p>
                                  <p className="status-value">{winnerLabel ? `${winnerLabel} wins` : `${turnLabel} to move`}</p>p>
                                  <p className="status-detail">
                                    {winner
                                                    ? `${winnerLabel} has won the game.`
                                                    : isAiMode && currentPlayer === 'black'
                                                      ? 'AI mode active. Black is thinking.'
                                                      : 'Select one of your pieces, then choose a highlighted square.'}
                                  </p>p>
                        </div>div>
                </section>section>
          
                <section className="play-area">
                        <div className="board-shell">
                                  <div className="mode-toggle" role="group" aria-label="Play mode">
                                              <button
                                                              type="button"
                                                              className={mode === 'two-player' ? 'mode-button active' : 'mode-button'}
                                                              aria-pressed={mode === 'two-player'}
                                                              onClick={() => setMode('two-player')}
                                                            >
                                                            Two Player
                                              </button>button>
                                              <button
                                                              type="button"
                                                              className={mode === 'ai' ? 'mode-button active' : 'mode-button'}
                                                              aria-pressed={mode === 'ai'}
                                                              onClick={() => setMode('ai')}
                                                            >
                                                            Play vs AI
                                              </button>button>
                                  </div>div>
                        
                                  <div className="board" role="grid" aria-label="Checkers board">
                                    {board.map((piece, index) => {
                          const { row, col } = indexToCoords(index);
                          const playable = (row + col) % 2 === 1;
                          const isSelected = selectedIndex === index;
                          const isDestination = destinationSquares.has(index);
                          const isActiveDestination = activeMove?.to === index;
                          const label = `Square ${index}, ${pieceLabel(piece)}`;
                          const draggable = Boolean(
                                            piece &&
                                              piece.color === currentPlayer &&
                                              humanTurn &&
                                              !currentStatus.winner,
                                          );
            
                          return (
                                            <button
                                                                key={index}
                                                                ref={(node) => {
                                                                                      squareRefs.current[index] = node;
                                                                }}
                                                                type="button"
                                                                className={squareClassName(index, isSelected, isDestination, isActiveDestination, playable)}
                                                                aria-label={label}
                                                                onClick={() => handleSquareClick(index)}
                                                                onKeyDown={(event) => handleSquareKeyDown(index, event)}
                                                                onDragStart={(event) => handleDragStart(index, event)}
                                                                onDrop={(event) => handleDrop(index, event)}
                                                                onDragOver={handleDragOver}
                                                                draggable={draggable}
                                                                disabled={!playable || Boolean(currentStatus.winner) || (isAiMode && currentPlayer === 'black')}
                                                                data-index={index}
                                                              >
                                              {isDestination && !piece ? <span className="hint" aria-hidden="true" /> : null}
                                                              <Piece piece={piece} />
                                            </button>button>
                                          );
          })}
                                  </div>div>
                        </div>div>
                
                        <aside className="sidebar">
                                  <div className="panel">
                                              <h2>How it works</h2>h2>
                                              <ul>
                                                            <li>Red starts at the top and moves downward.</li>li>
                                                            <li>Captures are mandatory and multi-jumps are supported.</li>li>
                                                            <li>Pieces become kings when they reach the far edge.</li>li>
                                                            <li>Arrow keys cycle legal destinations after a piece is selected.</li>li>
                                              </ul>ul>
                                  </div>div>
                        
                                  <div className="panel">
                                              <div className="panel-header">
                                                            <h2>Move Log</h2>h2>
                                                            <button type="button" className="restart" onClick={resetGame}>
                                                                            Restart
                                                            </button>button>
                                              </div>div>
                                              <ol className="history">
                                                {history.length === 0 ? <li>No moves yet.</li>li> : history.map((entry) => <li key={entry}>{entry}</li>li>)}
                                              </ol>ol>
                                  </div>div>
                        
                                  <div className="panel">
                                              <h2>Game State</h2>h2>
                                              <p>{currentStatus.winner ? currentStatus.reason : `Legal moves available: ${legalMoves.length}`}</p>p>
                                              <p>Mode: {isAiMode ? 'AI mode' : 'Two Player mode'}</p>p>
                                    {selectedIndex !== null ? <p>Selected square: {selectedIndex}</p>p> : <p>No piece selected.</p>p>}
                                  </div>div>
                        </aside>aside>
                </section>section>
          </main>main>
        );
}
</span>
