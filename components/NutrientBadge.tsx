
import React from 'react';

interface NutrientBadgeProps {
  label: string;
  value?: number;
  unit: string;
  isDM?: boolean;
}

export const NutrientBadge: React.FC<NutrientBadgeProps> = ({ label, value, unit, isDM }) => {
  if (value === undefined) return null;
  return (
    <div className={`p-2 rounded-lg border flex flex-col items-center ${isDM ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200'}`}>
      <span className="text-[10px] uppercase font-bold text-slate-400">{label} {isDM && '(MS)'}</span>
      <span className="text-sm font-semibold text-slate-700">
        {value.toFixed(2)}{unit}
      </span>
    </div>
  );
};
