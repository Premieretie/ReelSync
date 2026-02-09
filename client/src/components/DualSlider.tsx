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
        <span className={value < 2.5 ? 'text-white font-bold' : ''}>{leftLabel}</span>
        <span className={value > 2.5 ? 'text-white font-bold' : ''}>{rightLabel}</span>
      </div>
      <Slider
        defaultValue={[2.5]}
        max={5}
        step={0.5}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        className="cursor-pointer"
      />
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>0</span>
        <span>5</span>
      </div>
    </div>
  );
};
