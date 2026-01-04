import React, { useState, useRef } from 'react';

interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'tilt' | 'scale';
  glowColor?: 'amber' | 'blue' | 'green' | 'purple' | 'red';
  disabled?: boolean;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  onClick,
  className = '',
  hoverEffect = 'lift',
  glowColor = 'amber',
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || hoverEffect !== 'tilt') return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const getTiltStyle = () => {
    if (!isHovered || hoverEffect !== 'tilt' || !cardRef.current) return {};
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (mousePosition.y - centerY) / 10;
    const rotateY = (centerX - mousePosition.x) / 10;
    
    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
    };
  };

  const getHoverEffectClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    switch (hoverEffect) {
      case 'lift':
        return `${baseClasses} hover:transform hover:-translate-y-2 hover:shadow-2xl`;
      case 'glow':
        return `${baseClasses} hover:shadow-2xl`;
      case 'scale':
        return `${baseClasses} hover:scale-105 hover:shadow-xl`;
      case 'tilt':
        return `${baseClasses}`;
      default:
        return baseClasses;
    }
  };

  const getGlowClasses = () => {
    if (!isHovered || hoverEffect !== 'glow') return '';
    
    const glowColors = {
      amber: 'shadow-amber-400/25',
      blue: 'shadow-blue-400/25',
      green: 'shadow-green-400/25',
      purple: 'shadow-purple-400/25',
      red: 'shadow-red-400/25'
    };
    
    return glowColors[glowColor];
  };

  const cardClasses = `
    ${getHoverEffectClasses()}
    ${getGlowClasses()}
    ${onClick && !disabled ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
    relative overflow-hidden
  `;

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      style={hoverEffect === 'tilt' ? getTiltStyle() : undefined}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => !disabled && onClick?.()}
    >
      {/* Hover overlay */}
      {isHovered && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      
      {/* Shimmer effect on hover */}
      {isHovered && !disabled && hoverEffect === 'glow' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Ripple effect on click */}
      {onClick && !disabled && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`
            absolute w-0 h-0 rounded-full bg-white/20
            transition-all duration-500 ease-out
            ${isHovered ? 'w-full h-full -translate-x-1/2 -translate-y-1/2' : ''}
          `} style={{ left: '50%', top: '50%' }} />
        </div>
      )}
    </div>
  );
};

export default InteractiveCard;