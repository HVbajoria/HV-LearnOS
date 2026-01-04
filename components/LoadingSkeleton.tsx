import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animated?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  lines = 1,
  className = '',
  animated = true
}) => {
  const baseClasses = `
    bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800
    ${animated ? 'animate-pulse' : ''}
    ${className}
  `;

  const getDefaultHeight = () => {
    switch (variant) {
      case 'text': return '1rem';
      case 'circular': return '3rem';
      case 'rectangular': return '8rem';
      case 'card': return '12rem';
      default: return '1rem';
    }
  };

  const actualHeight = height || getDefaultHeight();

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} rounded`}
            style={{
              width: index === lines - 1 ? '75%' : width,
              height: actualHeight
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full`}
        style={{
          width: width,
          height: actualHeight
        }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} rounded-xl p-4`} style={{ width, height: actualHeight }}>
        <div className="space-y-3">
          {/* Header */}
          <div className="bg-zinc-600 h-4 rounded w-3/4" />
          {/* Content lines */}
          <div className="space-y-2">
            <div className="bg-zinc-600 h-3 rounded" />
            <div className="bg-zinc-600 h-3 rounded w-5/6" />
            <div className="bg-zinc-600 h-3 rounded w-4/6" />
          </div>
          {/* Footer */}
          <div className="flex justify-between pt-2">
            <div className="bg-zinc-600 h-3 rounded w-1/4" />
            <div className="bg-zinc-600 h-3 rounded w-1/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variant === 'rectangular' ? 'rounded-lg' : 'rounded'}`}
      style={{
        width,
        height: actualHeight
      }}
    />
  );
};

// Specialized skeleton components
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => (
  <LoadingSkeleton variant="text" lines={lines} className={className} />
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton variant="card" className={className} />
);

export const CircularSkeleton: React.FC<{ size?: string; className?: string }> = ({ size = '3rem', className }) => (
  <LoadingSkeleton variant="circular" width={size} height={size} className={className} />
);

export const ImageSkeleton: React.FC<{ width?: string; height?: string; className?: string }> = ({ 
  width = '100%', 
  height = '200px', 
  className 
}) => (
  <LoadingSkeleton variant="rectangular" width={width} height={height} className={className} />
);

export default LoadingSkeleton;