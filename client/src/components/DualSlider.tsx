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
    onChange(isRight ? -7 : 7);
  };

  return (
    <div className="w-full mb-8 flex flex-col gap-2">
      <div className="flex justify-between mb-2 text-sm font-medium text-slate-300">
        <span className={!isRight ? 'text-white font-bold' : 'opacity-70'}>{leftLabel}</span>
        <span className={isRight ? 'text-white font-bold' : 'opacity-70'}>{rightLabel}</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="relative w-20 h-10 rounded-full transition-all duration-200 flex items-center px-1 border bg-gradient-to-r from-purple-500 via-purple-700 to-indigo-600 border-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.35)] mx-auto"
      >
        <span
          className={`absolute top-1 left-3 h-8 w-6 rounded-full bg-slate-950 shadow-lg transform transition-transform duration-200 border ${isRight ? 'border-purple-200 translate-x-7' : 'border-slate-500 translate-x-0'}`}
        />
        <span className="sr-only">Toggle preference</span>
      </button>
    </div>
  );
};
