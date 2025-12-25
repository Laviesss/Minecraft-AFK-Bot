import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  colorMap: {
    low: string;
    med: string;
    high: string;
  };
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, colorMap }) => {
  const percentage = (value / max) * 100;

  let barColor = colorMap.high;
  if (percentage < 30) {
    barColor = colorMap.low;
  } else if (percentage < 60) {
    barColor = colorMap.med;
  }

  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
      <div
        className={`h-full transition-all duration-500 ease-out ${barColor}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
