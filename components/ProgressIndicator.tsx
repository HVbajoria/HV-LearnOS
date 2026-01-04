import React, { useEffect, useState } from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  showNumbers?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success';
  animated?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  total,
  showNumbers = true,
  showPercentage = false,
  size = 'md',
  color = 'primary',
  animated = true
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const progress = Math.min(100, Math.max(0, (current / total) * 100));

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-amber-400 to-orange-500',
    secondary: 'bg-gradient-to-r from-zinc-600 to-zinc-700',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600'
  };

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className={`
        w-full ${sizeClasses[size]} bg-zinc-800 rounded-full overflow-hidden
        shadow-inner relative
      `}>
        {/* Background glow */}
        <div className={`
          absolute inset-0 ${colorClasses[color]} opacity-10 rounded-full
        `} />
        
        {/* Progress fill */}
        <div
          className={`
            h-full ${colorClasses[color]} rounded-full
            transition-all duration-700 ease-out
            relative overflow-hidden
          `}
          style={{ width: `${animatedProgress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          
          {/* Moving highlight */}
          {animated && animatedProgress > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 animate-pulse" />
          )}
        </div>
        
        {/* Completion sparkle */}
        {progress >= 100 && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
      </div>
      
      {/* Labels */}
      {(showNumbers || showPercentage) && (
        <div className="flex justify-between items-center mt-2 text-sm">
          {showNumbers && (
            <span className="text-zinc-400">
              {current} of {total}
            </span>
          )}
          {showPercentage && (
            <span className="text-zinc-300 font-medium">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;