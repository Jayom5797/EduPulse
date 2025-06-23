import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface StatCardProps {
  icon: IconDefinition;
  label: string;
  value: number;
  colorClass?: string; // e.g. 'text-blue-600'
  bgClass?: string; // e.g. 'from-blue-50 to-blue-100'
  duration?: number; // ms for animation
  ariaLabel?: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  colorClass = 'text-blue-600',
  bgClass = 'from-blue-50 to-blue-100',
  duration = 1000,
  ariaLabel,
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);

  return (
    <div
      className={`bg-gradient-to-br ${bgClass} rounded-2xl shadow p-8 flex flex-col items-center`} 
      aria-label={ariaLabel || label}
    >
      <div className={`mb-2`}>
        <FontAwesomeIcon icon={icon} className={`w-8 h-8 ${colorClass}`} aria-hidden="true" />
      </div>
      <div className={`text-3xl font-extrabold ${colorClass}`}>{displayValue}{suffix}</div>
      <div className="text-gray-500 font-medium text-center">{label}</div>
    </div>
  );
};

export default StatCard; 