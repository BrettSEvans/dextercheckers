import { describe, expect, it } from 'vitest';
import {
    applyMove,
    createInitialBoard,
    chooseAIMove,
    getLegalMoves,
    getGameStatus,
    indexToCoords,
} from './checkers.js';

describe('checkers rules', () => {
    it('sets up the standard opening board', () => {
          const board = createInitialBoard();
          expect(board.filter(Boolean)).toHaveLength(24);
          expect(board[1]).toEqual({ color: 'red', king: false });
          expect(board[62]).toEqual({ color: 'black', king: false });
    });

           it('only allows captures when a capture is available', () => {
                 const board = Array(64).fill(null);
                 board[21] = { color: 'red', king: false };
                 board[30] = { color: 'black', king: false };
                 const moves = getLegalMoves(board, 'red');
                 expect(moves).toHaveLength(1);
                 expect(moves[0]).toMatchObject({ from: 21, to: 39, captures: [30] });
           });

           it('supports multi-capture moves', () => {
                 const board = Array(64).fill(null);
                 board[10] = { color: 'red', king: false };
                 board[19] = { color: 'black', king: false };
                 board[37] = { color: 'black', king: false };
                 const moves = getLegalMoves(board, 'red');
                 expect(moves).toHaveLength(1);
                 expect(moves[0]).toMatchObject({ from: 10, to: 46, captures: [19, 37] });
                 const nextBoard = applyMove(board, moves[0]);
                 expect(nextBoard[46]).toEqual({ color: 'red', king: false });
                 expect(nextBoard[19]).toBeNull();
                 expect(nextBoard[37]).toBeNull();
           });

           it('crowns a piece when it reaches the far edge', () => {
                 const board = Array(64).fill(null);
                 board[55] = { color: 'red', king: false };
                 const move = getLegalMoves(board, 'red').find((candidate) => candidate.to === 62);
                 const nextBoard = applyMove(board, move);
                 expect(nextBoard[62]).toEqual({ color: 'red', king: true });
           });

           it('allows kings to move backward', () => {
                 const board = Array(64).fill(null);
                 board[26] = { color: 'red', king: true };
                 const moves = getLegalMoves(board, 'red');
                 expect(moves.map((move) => move.to).sort()).toEqual([17, 19, 33, 35]);
           });

           it('declares a winner when the opponent has no legal moves', () => {
                 const board = Array(64).fill(null);
                 board[9] = { color: 'red', king: false };
                 board[0] = { color: 'black', king: false };
                 const status = getGameStatus(board, 'black');
                 expect(status.winner).toBe('red');
           });

           it('maps indexes to board coordinates for rendering', () => {
                 expect(indexToCoords(0)).toEqual({ row: 0, col: 0 });
                 expect(indexToCoords(63)).toEqual({ row: 7, col: 7 });
           });

           it('prefers captures for the AI', () => {
                 const board = Array(64).fill(null);
                 board[21] = { color: 'red', king: false };
                 board[30] = { color: 'black', king: false };
                 board[48] = { color: 'black', king: false };

                  const move = chooseAIMove(board, 'red');

                  expect(move).toMatchObject({ from: 21, to: 39, captures: [30] });
           });
});
