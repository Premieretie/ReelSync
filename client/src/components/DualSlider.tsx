import React from 'react';

interface DualSliderProps {
  leftLabel: string;
  rightLabel: string;
  value: number; // -5 (left) or 5 (right)
  onChange: (val: number) => void;
}

export const DualSlider: React.FC<DualSliderProps> = ({ leftLabel, rightLabel, value, onChange }) => {
  const isRight = value > 0;

  const toggle = () => {
    onChange(isRight ? -5 : 5);
  };

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2 text-sm font-medium text-slate-300">
        <span className={!isRight ? 'text-white font-bold' : 'opacity-70'}>{leftLabel}</span>
        <span className={isRight ? 'text-white font-bold' : 'opacity-70'}>{rightLabel}</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`relative w-16 h-9 rounded-full transition-colors duration-200 flex items-center px-1 border border-slate-700 ${isRight ? 'bg-green-500/80' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${isRight ? 'translate-x-7' : 'translate-x-0'}`}
        />
        <span className="sr-only">Toggle preference</span>
      </button>
    </div>
  );
};
