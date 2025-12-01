export type Grid = number[][];

export interface CellData {
  row: number;
  col: number;
  value: number; // 0 for empty
  notes: number[]; // Array of numbers 1-9 for draft mode
  isFixed: boolean; // True if part of the initial puzzle
  isError?: boolean; // True if validated as incorrect
}

export type BoardData = CellData[][];

export enum GameStatus {
  IDLE = 'IDLE',
  READY = 'READY',    // Board generated, waiting for player to start
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',  // Game paused, timer stopped
  WON = 'WON',
  FAILED = 'FAILED',  // Game ended with incorrect solution
}

export interface GameRecord {
  id: number;
  result: 'Success' | 'Fail';
  time: number; // in seconds
  difficulty: number;
  timestamp: string;
}