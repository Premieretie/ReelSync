import React from 'react';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';

interface DualSliderProps {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (val: number) => void;
}

export const DualSlider: React.FC<DualSliderProps> = ({ leftLabel, rightLabel, value, onChange }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2 text-sm font-medium text-slate-300">
        <span className={value < 0 ? 'text-white font-bold scale-110 transition-transform' : 'opacity-70 transition-opacity'}>{leftLabel}</span>
        <span className={value === 0 ? 'text-xs text-slate-500 font-normal uppercase tracking-widest' : 'opacity-0'}>Neutral</span>
        <span className={value > 0 ? 'text-white font-bold scale-110 transition-transform' : 'opacity-70 transition-opacity'}>{rightLabel}</span>
      </div>
      <Slider
        defaultValue={[0]}
        min={-5}
        max={5}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        className="cursor-pointer"
      />
      <div className="flex justify-between mt-1 text-xs text-slate-500 font-mono">
        <span>5</span>
        <span className="opacity-20">|</span>
        <span className="opacity-20">|</span>
        <span className="opacity-20">|</span>
        <span className="opacity-20">|</span>
        <span>0</span>
        <span className="opacity-20">|</span>
        <span className="opacity-20">|</span>
        <span className="opacity-20">|</span>
        <span className="opacity-20">|</span>
        <span>5</span>
      </div>
    </div>
  );
};
