import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, CheckCircle, Eye, RefreshCw, AlertCircle, Play, Pause, Clock, Trophy, History as HistoryIcon, Eraser, RotateCcw, Pencil } from 'lucide-react';
import { generateSudokuPuzzle } from './utils/sudokuLogic';
import { BoardData, Grid, GameStatus, GameRecord } from './types';
import NumberPad from './components/NumberPad';

const App: React.FC = () => {
  const [boardData, setBoardData] = useState<BoardData>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [difficulty, setDifficulty] = useState<number>(35);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // New State Features
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [isDraftMode, setIsDraftMode] = useState<boolean>(false);
  
  const timerRef = useRef<number | null>(null);

  // Initialize a game (Prepare stage)
  const prepareNewGame = useCallback(async () => {
    setLoading(true);
    setStatus(GameStatus.IDLE);
    setMessage(null);
    setSelectedCell(null);
    setTimeElapsed(0);
    setIsDraftMode(false);
    
    // Clear existing timer if any
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }

    setTimeout(() => {
      const { puzzle, solution: solvedGrid } = generateSudokuPuzzle(difficulty);
      setSolution(solvedGrid);

      const newBoard: BoardData = puzzle.map((row, rIndex) =>
        row.map((val, cIndex) => ({
          row: rIndex,
          col: cIndex,
          value: val,
          notes: [],
          isFixed: val !== 0,
          isError: false,
        }))
      );

      setBoardData(newBoard);
      setStatus(GameStatus.READY); // Ready to start
      setLoading(false);
    }, 100);
  }, [difficulty]);

  // Initial load
  useEffect(() => {
    prepareNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Timer Logic
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleStartGame = () => {
    if (status === GameStatus.READY) {
      setStatus(GameStatus.PLAYING);
      setMessage({ text: '计时开始！请开始填数字。', type: 'info' });
    }
  };

  const handlePause = () => {
    if (status === GameStatus.PLAYING) {
        setStatus(GameStatus.PAUSED);
        setMessage({ text: '游戏已暂停', type: 'info' });
    }
  };

  const handleResume = () => {
    if (status === GameStatus.PAUSED) {
        setStatus(GameStatus.PLAYING);
        setMessage({ text: '游戏继续', type: 'info' });
    }
  };

  const handleClearAll = () => {
    if (status !== GameStatus.PLAYING) return;
    
    // Clear all non-fixed cells (values and notes)
    const newBoard = boardData.map(row => 
      row.map(cell => ({
        ...cell,
        value: cell.isFixed ? cell.value : 0,
        notes: [],
        isError: false
      }))
    );
    setBoardData(newBoard);
    setMessage({ text: '已清除所有填写内容，计时继续。', type: 'info' });
  };

  const handleRestart = () => {
    if (boardData.length === 0) return;
    if (status === GameStatus.READY) return;

    // Reset Board (Clear all user input)
    const newBoard = boardData.map(row => 
      row.map(cell => ({
        ...cell,
        value: cell.isFixed ? cell.value : 0,
        notes: [],
        isError: false
      }))
    );
    setBoardData(newBoard);

    // Reset Game State to PLAYING (Refill allowed, Timer restarts from 0)
    setTimeElapsed(0);
    setStatus(GameStatus.PLAYING);
    setMessage({ text: '游戏重新开始！计时器已重置。', type: 'info' });
  };

  const handleCellClick = (row: number, col: number) => {
    if (status !== GameStatus.PLAYING) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || status !== GameStatus.PLAYING) return;
    const { row, col } = selectedCell;

    if (boardData[row][col].isFixed) return;

    // Deep copy to ensure state immutability
    const newBoard = boardData.map(r => r.map(c => ({ ...c, notes: [...c.notes] })));
    const cell = newBoard[row][col];

    if (isDraftMode) {
        // Draft Mode Logic
        if (cell.value === 0) {
            // Toggle note
            if (cell.notes.includes(num)) {
                cell.notes = cell.notes.filter(n => n !== num);
            } else {
                cell.notes.push(num);
                cell.notes.sort((a, b) => a - b);
            }
        } else {
            // If cell has a value, do nothing in draft mode 
            // (User implies they want to edit notes, but must clear value first)
            // Alternatively, we could clear value and add note, but it's safer to separate actions.
            return;
        }
    } else {
        // Normal Mode Logic
        cell.value = num;
        cell.notes = []; // Clear notes when a value is placed
        cell.isError = false; 
    }

    setBoardData(newBoard);
  };

  const handleDelete = () => {
    if (!selectedCell || status !== GameStatus.PLAYING) return;
    const { row, col } = selectedCell;

    if (boardData[row][col].isFixed) return;

    const newBoard = boardData.map(r => r.map(c => ({ ...c, notes: [...c.notes] })));
    const cell = newBoard[row][col];

    if (cell.value !== 0) {
        cell.value = 0;
        cell.isError = false;
    } else {
        cell.notes = [];
    }
    
    setBoardData(newBoard);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      } else if (e.key.startsWith('Arrow')) {
        if (!selectedCell) {
            setSelectedCell({ row: 0, col: 0 });
            return;
        }
        let { row, col } = selectedCell;
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') row = Math.min(8, row + 1);
        if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') col = Math.min(8, col + 1);
        setSelectedCell({ row, col });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, status, boardData, isDraftMode]); 

  const handleSubmit = () => {
    // 1. Stop the timer (Change status)
    // 2. Validate
    // 3. Update Score/History
    
    let isCorrect = true;
    let filledCount = 0;
    const newBoard = boardData.map(row => row.map(cell => ({ ...cell })));

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = newBoard[r][c];
        if (cell.value !== 0) {
            filledCount++;
            if (cell.value !== solution[r][c]) {
                cell.isError = true;
                isCorrect = false;
            } else {
                cell.isError = false;
            }
        } else {
            // Empty cell implies incorrect for a full submission check
            isCorrect = false;
        }
      }
    }

    setBoardData(newBoard);

    const recordId = Date.now();
    const timestamp = new Date().toLocaleTimeString();

    if (isCorrect && filledCount === 81) {
      setStatus(GameStatus.WON);
      setScore(s => s + 1);
      setMessage({ text: `恭喜你，答对了！用时: ${formatTime(timeElapsed)}`, type: 'success' });
      
      const newRecord: GameRecord = {
        id: recordId,
        result: 'Success',
        time: timeElapsed,
        difficulty,
        timestamp
      };
      setHistory(prev => [newRecord, ...prev]);

    } else {
      // Failed Attempt
      setStatus(GameStatus.FAILED);
      
      if (filledCount < 81) {
           setMessage({ text: '还有未填写的格子，验证失败。', type: 'error' });
      } else {
           setMessage({ text: '答案有误，请检查红色的格子。', type: 'error' });
      }

      const newRecord: GameRecord = {
        id: recordId,
        result: 'Fail',
        time: timeElapsed,
        difficulty,
        timestamp
      };
      setHistory(prev => [newRecord, ...prev]);
    }
  };

  const handleShowAnswer = () => {
    if (status === GameStatus.READY) return;
    
    if (status !== GameStatus.WON && status !== GameStatus.FAILED) {
        if (!window.confirm("确定要查看答案吗？当前游戏将结束。")) return;
    }

    const newBoard = boardData.map((row, r) =>
        row.map((cell, c) => ({
            ...cell,
            value: solution[r][c],
            notes: [],
            isError: false,
            isFixed: true 
        }))
    );
    setBoardData(newBoard);
    
    if (status === GameStatus.PLAYING || status === GameStatus.PAUSED) {
        setStatus(GameStatus.FAILED); // Viewing answer forfeits the game
    }
    setMessage({ text: '已显示正确答案。', type: 'info' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 px-2 sm:px-4 font-sans select-none pb-20">
      
      {/* Header */}
      <header className="w-full max-w-md mb-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">数独 Sudoku</h1>
        <div className="flex items-center space-x-3">
             <div className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                <Trophy size={16} className="mr-1"/>
                <span className="font-bold">{score}</span>
            </div>
            <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 min-w-24 justify-between space-x-2">
                <div className="flex items-center">
                    <Clock size={16} className="mr-1"/>
                    <span className="font-mono font-bold w-12 text-center">{formatTime(timeElapsed)}</span>
                </div>
                {/* Pause/Resume Toggle in Header */}
                {status === GameStatus.PLAYING && (
                    <button 
                        onClick={handlePause} 
                        className="p-1 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                        aria-label="暂停"
                    >
                        <Pause size={16} fill="currentColor" />
                    </button>
                )}
                {status === GameStatus.PAUSED && (
                    <button 
                        onClick={handleResume} 
                        className="p-1 hover:bg-blue-100 rounded-full text-green-600 animate-pulse transition-colors"
                        aria-label="继续"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* Controls */}
      <div className="w-full max-w-md mb-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-500 flex items-center">
                <Settings size={14} className="mr-1"/>
                预设数字 (难度): <span className="text-blue-600 font-bold ml-1 text-sm">{difficulty}</span>
            </label>
        </div>
        <div className="flex items-center space-x-3">
            <input
            type="range"
            min="15"
            max="80"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            disabled={loading || status === GameStatus.PLAYING || status === GameStatus.PAUSED}
            />
            <button 
                onClick={prepareNewGame}
                disabled={loading}
                className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition text-xs font-bold whitespace-nowrap disabled:opacity-50"
            >
                <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                重置
            </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="w-full max-w-md h-10 mb-2">
        {message && (
            <div className={`w-full h-full px-4 rounded-lg text-sm font-medium flex items-center justify-center shadow-sm animate-fade-in
                ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
                ${message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : ''}
                ${message.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}
            `}>
                {message.type === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                {message.type === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
                {message.text}
            </div>
        )}
      </div>

      {/* Sudoku Board Container */}
      <div className="relative w-full max-w-md aspect-square mb-0">
        {/* Board */}
        <div className={`w-full h-full bg-gray-800 p-1 rounded-lg shadow-lg overflow-hidden transition-all duration-300
            ${status === GameStatus.READY ? 'blur-sm opacity-50' : ''}
            ${status === GameStatus.PAUSED ? 'blur-md opacity-30' : ''}
            ${status !== GameStatus.READY && status !== GameStatus.PAUSED ? 'opacity-100' : ''}
        `}>
            <div className="grid grid-cols-9 grid-rows-9 gap-[1px] bg-gray-300 border-2 border-gray-800 w-full h-full">
            {boardData.map((row, rIndex) => (
                row.map((cell, cIndex) => {
                    const isSelected = selectedCell?.row === rIndex && selectedCell?.col === cIndex;
                    const isRelated = selectedCell && (selectedCell.row === rIndex || selectedCell.col === cIndex);
                    const isSameValue = selectedCell && cell.value !== 0 && boardData[selectedCell.row][selectedCell.col].value === cell.value;
                    const borderRight = (cIndex + 1) % 3 === 0 && cIndex !== 8 ? 'border-r-2 border-r-gray-800' : '';
                    const borderBottom = (rIndex + 1) % 3 === 0 && rIndex !== 8 ? 'border-b-2 border-b-gray-800' : '';

                    return (
                        <div
                        key={`${rIndex}-${cIndex}`}
                        onClick={() => handleCellClick(rIndex, cIndex)}
                        className={`
                            relative flex items-center justify-center cursor-pointer select-none transition-colors duration-75
                            ${borderRight} ${borderBottom}
                            ${cell.isError ? 'bg-red-100 text-red-600' : ''}
                            ${!cell.isError && isSelected ? 'bg-blue-500 text-white z-10' : ''}
                            ${!cell.isError && !isSelected && isSameValue ? 'bg-blue-200' : ''}
                            ${!cell.isError && !isSelected && !isSameValue && isRelated ? 'bg-gray-100' : 'bg-white'}
                            ${cell.isFixed ? (!isSelected ? 'text-gray-900' : 'text-white') : (!isSelected && !cell.isError ? 'text-blue-600' : '')}
                        `}
                        >
                            {/* Render Main Value */}
                            {cell.value !== 0 && (
                                <span className="text-lg sm:text-2xl font-semibold">
                                    {cell.value}
                                </span>
                            )}

                            {/* Render Draft Notes */}
                            {cell.value === 0 && cell.notes.length > 0 && (
                                <div className="grid grid-cols-3 grid-rows-3 w-full h-full pointer-events-none p-0.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <div key={num} className="flex items-center justify-center">
                                            {cell.notes.includes(num) && (
                                                <span className={`text-[8px] sm:text-[10px] leading-none ${isSelected ? 'text-white' : 'text-gray-500 font-bold'}`}>
                                                    {num}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            ))}
            </div>
        </div>

        {/* Start Game Overlay */}
        {status === GameStatus.READY && !loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
                <button 
                    onClick={handleStartGame}
                    className="bg-blue-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-105 transition transform flex items-center"
                >
                    <Play fill="currentColor" className="mr-2"/>
                    开始游戏
                </button>
            </div>
        )}

        {/* Paused Overlay */}
        {status === GameStatus.PAUSED && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/20 backdrop-blur-sm z-20 rounded-lg">
                <h3 className="text-gray-800 bg-white/90 px-4 py-2 rounded-lg font-bold mb-4 shadow-lg">游戏暂停</h3>
                <button 
                    onClick={handleResume}
                    className="bg-green-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-2xl hover:bg-green-700 hover:scale-105 transition transform flex items-center"
                >
                    <Play fill="currentColor" className="mr-2"/>
                    继续游戏
                </button>
            </div>
        )}

        {/* Loading Overlay */}
        {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-30 rounded-lg">
                <RefreshCw className="animate-spin mb-2 text-blue-600" size={32} />
                <p className="text-gray-600 font-medium">生成唯一解数独...</p>
            </div>
        )}
      </div>

      {/* Number Pad */}
      <div className="w-full max-w-md mb-6">
        <NumberPad 
            onNumberClick={handleNumberInput}
            onDelete={handleDelete}
            disabled={status !== GameStatus.PLAYING}
        />
      </div>

      {/* Action Buttons Row 1: Tools */}
      <div className="w-full max-w-md flex gap-3 mb-3">
        <button
            onClick={handleClearAll}
            disabled={status !== GameStatus.PLAYING}
            className="flex-1 bg-orange-100 hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 text-orange-700 font-bold py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center border border-orange-200"
        >
            <Eraser className="mr-2" size={18} />
            全部擦掉
        </button>
        <button
            onClick={handleRestart}
            disabled={loading || status === GameStatus.IDLE || status === GameStatus.READY}
            className="flex-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 text-blue-700 font-bold py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center"
        >
            <RotateCcw className="mr-2" size={18} />
            重来一次
        </button>
        <button
            onClick={() => setIsDraftMode(!isDraftMode)}
            disabled={status !== GameStatus.PLAYING}
            className={`flex-1 font-bold py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center border
                ${isDraftMode 
                    ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-200' 
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400'}
            `}
        >
            <Pencil className="mr-2" size={18} fill={isDraftMode ? "currentColor" : "none"} />
            {isDraftMode ? '退出草稿' : '草稿模式'}
        </button>
      </div>

      {/* Action Buttons Row 2: Submit/Answer */}
      <div className="w-full max-w-md flex gap-3 mb-6">
        <button
            onClick={handleSubmit}
            disabled={status !== GameStatus.PLAYING}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center"
        >
            <CheckCircle className="mr-2" size={20} />
            提交验证
        </button>
        <button
            onClick={handleShowAnswer}
            disabled={loading || status === GameStatus.IDLE}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-bold py-3 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center"
        >
            <Eye className="mr-2" size={20} />
            查看答案
        </button>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="w-full max-w-md mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <HistoryIcon size={16} className="mr-2"/>
                游戏记录
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-500 font-medium">结果</th>
                                <th className="px-4 py-2 text-left text-gray-500 font-medium">用时</th>
                                <th className="px-4 py-2 text-left text-gray-500 font-medium">难度</th>
                                <th className="px-4 py-2 text-right text-gray-500 font-medium">时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                            ${record.result === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                        `}>
                                            {record.result === 'Success' ? '答对了' : '失败'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-gray-600">{formatTime(record.time)}</td>
                                    <td className="px-4 py-2 text-gray-600">{record.difficulty}</td>
                                    <td className="px-4 py-2 text-right text-gray-400 text-xs">{record.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;