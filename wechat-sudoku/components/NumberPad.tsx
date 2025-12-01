import React from 'react';
import { Eraser } from 'lucide-react';

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onDelete: () => void;
  disabled: boolean;
}

const NumberPad: React.FC<NumberPadProps> = ({ onNumberClick, onDelete, disabled }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-5 gap-2 w-full max-w-md mx-auto mt-4 px-2">
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          disabled={disabled}
          className={`
            h-12 sm:h-14 rounded-lg font-bold text-xl sm:text-2xl shadow-sm transition-all
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 active:bg-blue-100 active:scale-95'
            }
          `}
        >
          {num}
        </button>
      ))}
      <button
        onClick={onDelete}
        disabled={disabled}
        className={`
          h-12 sm:h-14 rounded-lg flex items-center justify-center shadow-sm transition-all
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 active:bg-red-200 active:scale-95'
          }
        `}
        aria-label="Delete"
      >
        <Eraser size={24} />
      </button>
    </div>
  );
};

export default NumberPad;