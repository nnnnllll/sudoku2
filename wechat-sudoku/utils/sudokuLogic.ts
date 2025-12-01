import { Grid } from '../types';

const GRID_SIZE = 9;
const BOX_SIZE = 3;

// Create an empty 9x9 grid
const getEmptyGrid = (): Grid => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

// Check if a number is safe to place at row, col
const isSafe = (grid: Grid, row: number, col: number, num: number): boolean => {
  // Check row and column
  for (let x = 0; x < GRID_SIZE; x++) {
    if (grid[row][x] === num || grid[x][col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const startRow = row - (row % BOX_SIZE);
  const startCol = col - (col % BOX_SIZE);
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (grid[i + startRow][j + startCol] === num) {
        return false;
      }
    }
  }

  return true;
};

// Solve grid using backtracking. Returns true if solved.
// Modifies grid in-place.
const solveGrid = (grid: Grid): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        // Try numbers 1-9
        for (let num = 1; num <= 9; num++) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveGrid(grid)) {
              return true;
            }
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

// Count number of solutions. returns > 1 if multiple.
// Optimization: Stop counting after 2 to save time.
const countSolutions = (grid: Grid, count = { val: 0 }): number => {
  if (count.val > 1) return count.val;

  let row = -1;
  let col = -1;
  let isEmpty = false;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = true;
        break;
      }
    }
    if (isEmpty) break;
  }

  if (!isEmpty) {
    count.val++;
    return count.val;
  }

  for (let num = 1; num <= 9; num++) {
    if (isSafe(grid, row, col, num)) {
      grid[row][col] = num;
      countSolutions(grid, count);
      grid[row][col] = 0;
    }
  }
  return count.val;
};

// Generate a completely filled valid board
const generateFullBoard = (): Grid => {
  const grid = getEmptyGrid();
  
  // Fill diagonal boxes first (independent of each other) to ensure randomness
  for (let i = 0; i < GRID_SIZE; i = i + BOX_SIZE) {
    fillBox(grid, i, i);
  }

  // Solve the rest
  solveGrid(grid);
  return grid;
};

const fillBox = (grid: Grid, row: number, col: number) => {
  let num: number;
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeBox(grid, row, col, num));
      grid[row + i][col + j] = num;
    }
  }
};

const isSafeBox = (grid: Grid, rowStart: number, colStart: number, num: number) => {
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (grid[rowStart + i][colStart + j] === num) {
        return false;
      }
    }
  }
  return true;
};

// Generate a puzzle with a specific number of clues (approximate) and Unique Solution
export const generateSudokuPuzzle = (cluesCount: number): { puzzle: Grid; solution: Grid } => {
  // 1. Generate full board
  const solution = generateFullBoard();
  
  // Copy for the puzzle
  const puzzle = solution.map(row => [...row]);
  
  // 2. Remove numbers
  // Note: 17 is generally the minimum for a unique solution.
  // If user requests < 17, we might not get a unique solution easily, 
  // but we will try our best to respect the count while maintaining uniqueness.
  
  let attempts = cluesCount > 25 ? 5 : 20; // more attempts for harder puzzles
  let cellsToRemove = 81 - cluesCount;
  
  const positions = [];
  for(let r=0; r<9; r++) for(let c=0; c<9; c++) positions.push([r, c]);
  
  // Shuffle positions to remove randomly
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [r, c] of positions) {
    if (cellsToRemove <= 0) break;

    const backup = puzzle[r][c];
    if (backup === 0) continue; // Already removed

    puzzle[r][c] = 0;

    // Check Uniqueness
    const gridCopy = puzzle.map(row => [...row]);
    const solutions = countSolutions(gridCopy, { val: 0 });

    if (solutions !== 1) {
      // Not unique, put it back
      puzzle[r][c] = backup;
      attempts--; // Use up an "attempt" to find a removable cell
      if (attempts <= 0 && cellsToRemove > 0) {
        // If we struggle too much to remove cells while keeping uniqueness, stop.
        // It's better to have a slightly easier puzzle than an infinite loop or non-unique one.
        console.warn("Could not reach target difficulty with unique solution. Stopping early.");
        break;
      }
    } else {
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
};

export const deepCopyGrid = (grid: Grid): Grid => grid.map(row => [...row]);
