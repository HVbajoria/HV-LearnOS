import React, { useState } from 'react';
import { Icons } from '../constants';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  color = 'primary',
  size = 'md',
  pulse = false,
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const colorClasses = {
    primary: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black shadow-amber-400/25',
    secondary: 'bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white shadow-zinc-700/25',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/25',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25'
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          ${sizeClasses[size]} ${colorClasses[color]}
          rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          shadow-lg hover:shadow-xl
          transform hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${pulse ? 'animate-pulse' : ''}
          ${isPressed ? 'scale-95' : ''}
          relative overflow-hidden
        `}
      >
        {/* Ripple effect */}
        <div className={`
          absolute inset-0 rounded-full
          transition-all duration-300
          ${isHovered ? 'bg-white/10' : 'bg-transparent'}
        `} />
        
        {/* Icon */}
        <div className={`
          relative z-10 transition-transform duration-200
          ${isPressed ? 'scale-90' : ''}
        `}>
          {icon}
        </div>
        
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-full blur-md opacity-0
          transition-opacity duration-300
          ${isHovered ? 'opacity-30' : ''}
          ${colorClasses[color].split(' ')[0]}
        `} />
      </button>
      
      {/* Tooltip */}
      <div className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-3 py-1 bg-zinc-900 text-white text-sm rounded-lg
        opacity-0 pointer-events-none transition-all duration-200
        ${isHovered ? 'opacity-100 translate-y-0' : 'translate-y-2'}
        whitespace-nowrap shadow-lg border border-zinc-700
      `}>
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900" />
      </div>
    </div>
  );
};

export default FloatingActionButton;