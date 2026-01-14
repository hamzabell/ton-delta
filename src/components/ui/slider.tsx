"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
}

const Slider = ({ value, onValueChange, max = 100, min = 0, step = 1, className }: SliderProps) => {
  const [localValue, setLocalValue] = React.useState(value[0]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setLocalValue(newVal);
    onValueChange([newVal]);
  };

  React.useEffect(() => {
    setLocalValue(value[0]);
  }, [value]);

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
      />
      
      {/* Track */}
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-800">
        <div 
            className="h-full bg-emerald-500 transition-all" 
            style={{ width: `${percentage}%` }}
        />
      </div>

       {/* Thumb (Visual only, aligned by CSS) */}
      <div 
        className="absolute z-10 h-5 w-5 rounded-full border-2 border-emerald-500 bg-slate-950 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  )
}

export { Slider }
