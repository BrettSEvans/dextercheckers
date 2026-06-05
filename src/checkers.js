const BOARD_SIZE = 8;
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

export function indexToCoords(index) {
    return {
          row: Math.floor(index / BOARD_SIZE),
          col: index % BOARD_SIZE,
    };
}

export function coordsToIndex(row, col) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
          return null;
    }
    return row * BOARD_SIZE + col;
}

function isPlayableSquare(index) {
    const { row, col } = indexToCoords(index);
    return (row + col) % 2 === 1;
}

function cloneBoard(board) {
    return board.map((piece) => (piece ? { ...piece } : null));
}

function getForwardDirection(color) {
    return color === 'red' ? 1 : -1;
}

function getPromotionRow(color) {
    return color === 'red' ? BOARD_SIZE - 1 : 0;
}

function getOpponent(color) {
    return color === 'red' ? 'black' : 'red';
}

function getCaptureOptions(board, index, piece) {
    const { row, col } = indexToCoords(index);
    const directions = piece.king
      ? [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1],
              ]
          : [
                    [getForwardDirection(piece.color), -1],
                    [getForwardDirection(piece.color), 1],
                  ];

  return directions.flatMap(([rowStep, colStep]) => {
        const middleRow = row + rowStep;
        const middleCol = col + colStep;
        const landingRow = row + rowStep * 2;
        const landingCol = col + colStep * 2;
        const middleIndex = coordsToIndex(middleRow, middleCol);
        const landingIndex = coordsToIndex(landingRow, landingCol);

                                if (middleIndex === null || landingIndex === null) {
                                        return [];
                                }

                                if (!isPlayableSquare(landingIndex) || !isPlayableSquare(middleIndex)) {
                                        return [];
                                }

                                const middlePiece = board[middleIndex];
        if (!middlePiece || middlePiece.color === piece.color || board[landingIndex]) {
                return [];
        }

                                return [
                                  {
                                            from: index,
                                            to: landingIndex,
                                            captures: [middleIndex],
                                            path: [index, landingIndex],
                                  },
                                      ];
  });
}

function getStepOptions(board, index, piece) {
    const { row, col } = indexToCoords(index);
    const directions = piece.king
      ? [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1],
              ]
          : [
                    [getForwardDirection(piece.color), -1],
                    [getForwardDirection(piece.color), 1],
                  ];

  return directions.flatMap(([rowStep, colStep]) => {
        const landingRow = row + rowStep;
        const landingCol = col + colStep;
        const landingIndex = coordsToIndex(landingRow, landingCol);
        if (landingIndex === null) {
                return [];
        }
        if (!isPlayableSquare(landingIndex) || board[landingIndex]) {
                return [];
        }
        return [
          {
                    from: index,
                    to: landingIndex,
                    captures: [],
                    path: [index, landingIndex],
          },
              ];
  });
}

function exploreCaptureSequences(board, index, piece, originIndex, capturedIndices = [], path = [index]) {
    const options = getCaptureOptions(board, index, piece);
    if (options.length === 0) {
          return [];
    }

  const results = [];

  for (const option of options) {
        const nextBoard = cloneBoard(board);
        const movingPiece = { ...piece };
        nextBoard[index] = null;
        for (const capturedIndex of option.captures) {
                nextBoard[capturedIndex] = null;
        }
        nextBoard[option.to] = movingPiece;

      const { row } = indexToCoords(option.to);
        const promoted = row === getPromotionRow(piece.color);
        if (promoted && !movingPiece.king) {
                results.push({
                          from: originIndex,
                          to: option.to,
                          captures: [...capturedIndices, ...option.captures],
                          path: [...path, option.to],
                });
                continue;
        }

      const continuations = exploreCaptureSequences(
              nextBoard,
              option.to,
              movingPiece,
              originIndex,
              [...capturedIndices, ...option.captures],
              [...path, option.to],
            );

      if (continuations.length > 0) {
              results.push(...continuations);
      } else {
              results.push({
                        from: originIndex,
                        to: option.to,
                        captures: [...capturedIndices, ...option.captures],
                        path: [...path, option.to],
              });
      }
  }

  return results;
}

export function createInitialBoard() {
    const board = Array(BOARD_CELLS).fill(null);
    for (let index = 0; index < BOARD_CELLS; index += 1) {
          if (!isPlayableSquare(index)) {
                  continue;
          }
          const { row } = indexToCoords(index);
          if (row < 3) {
                  board[index] = { color: 'red', king: false };
          } else if (row > 4) {
                  board[index] = { color: 'black', king: false };
          }
    }
    return board;
}

export function getLegalMoves(board, color, forcedIndex = null) {
    const captureMoves = [];
    const stepMoves = [];
    const indexes = forcedIndex === null ? board.map((piece, index) => (piece && piece.color === color ? index : null)).filter((value) => value !== null) : [forcedIndex];
    const anyCaptureExists = indexes.some((index) => {
          const piece = board[index];
          return piece ? getCaptureOptions(board, index, piece).length > 0 : false;
    });

  for (const index of indexes) {
        const piece = board[index];
        if (!piece || piece.color !== color) {
                continue;
        }

      const captures = getCaptureOptions(board, index, piece);
        if (captures.length > 0) {
                const sequences = exploreCaptureSequences(board, index, piece, index);
                captureMoves.push(...sequences);
                continue;
        }

      if (!anyCaptureExists) {
              stepMoves.push(...getStepOptions(board, index, piece));
      }
  }

  return anyCaptureExists ? captureMoves : stepMoves;
}

export function applyMove(board, move) {
    if (!move) {
          return board;
    }

  const nextBoard = cloneBoard(board);
    const piece = nextBoard[move.from];
    if (!piece) {
          return board;
    }

  nextBoard[move.from] = null;
    for (const capturedIndex of move.captures) {
          nextBoard[capturedIndex] = null;
    }

  const updatedPiece = { ...piece };
    const promotionRow = getPromotionRow(piece.color);
    const { row } = indexToCoords(move.to);
    if (!updatedPiece.king && row === promotionRow) {
          updatedPiece.king = true;
    }

  nextBoard[move.to] = updatedPiece;
    return nextBoard;
}

export function getGameStatus(board, currentPlayer) {
    const redPieces = board.some((piece) => piece?.color === 'red');
    const blackPieces = board.some((piece) => piece?.color === 'black');

  if (!redPieces) {
        return { winner: 'black', reason: 'red has no pieces left' };
  }

  if (!blackPieces) {
        return { winner: 'red', reason: 'black has no pieces left' };
  }

  if (getLegalMoves(board, currentPlayer).length === 0) {
        return { winner: getOpponent(currentPlayer), reason: `${currentPlayer} has no legal moves` };
  }

  return { winner: null, reason: null };
}

export function createEmptyBoard() {
    return Array(BOARD_CELLS).fill(null);
}

function movePromotes(board, move) {
    const piece = board[move.from];
    if (!piece || piece.king) {
          return false;
    }
    return indexToCoords(move.to).row === getPromotionRow(piece.color);
}

export function chooseAIMove(board, color) {
    const moves = getLegalMoves(board, color);
    if (moves.length === 0) {
          return null;
    }

  return [...moves].sort((left, right) => {
        const captureDelta = right.captures.length - left.captures.length;
        if (captureDelta !== 0) {
                return captureDelta;
        }

                             const promotionDelta = Number(movePromotes(board, right)) - Number(movePromotes(board, left));
        if (promotionDelta !== 0) {
                return promotionDelta;
        }

                             if (left.from !== right.from) {
                                     return left.from - right.from;
                             }

                             return left.to - right.to;
  })[0];
}
