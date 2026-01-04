import React, { useState, useEffect } from 'react';

interface MicroInteractionProps {
  children: React.ReactNode;
  type?: 'hover-lift' | 'click-ripple' | 'focus-glow' | 'magnetic' | 'tilt';
  intensity?: 'subtle' | 'medium' | 'strong';
  disabled?: boolean;
  className?: string;
}

const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type = 'hover-lift',
  intensity = 'medium',
  disabled = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (type === 'magnetic' && !disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setMousePosition({ x: x * 0.1, y: y * 0.1 });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (type === 'click-ripple' && !disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
  };

  const getTransformStyle = () => {
    if (disabled) return {};

    switch (type) {
      case 'hover-lift':
        return {
          transform: isHovered 
            ? `translateY(-${intensity === 'subtle' ? '2px' : intensity === 'medium' ? '4px' : '8px'}) scale(${intensity === 'subtle' ? '1.01' : intensity === 'medium' ? '1.02' : '1.05'})` 
            : 'translateY(0) scale(1)',
          transition: 'transform 0.2s ease-out'
        };
      
      case 'magnetic':
        return {
          transform: isHovered 
            ? `translate(${mousePosition.x}px, ${mousePosition.y}px)` 
            : 'translate(0, 0)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out'
        };
      
      case 'tilt':
        return {
          transform: isHovered 
            ? `perspective(1000px) rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)` 
            : 'perspective(1000px) rotateX(0) rotateY(0)',
          transition: 'transform 0.2s ease-out'
        };
      
      default:
        return {};
    }
  };

  const getGlowStyle = () => {
    if (type === 'focus-glow' && (isFocused || isHovered) && !disabled) {
      const glowIntensity = intensity === 'subtle' ? '10px' : intensity === 'medium' ? '20px' : '30px';
      return {
        boxShadow: `0 0 ${glowIntensity} rgba(251, 191, 36, 0.3)`,
        transition: 'box-shadow 0.3s ease-out'
      };
    }
    return {};
  };

  const combinedStyle = {
    ...getTransformStyle(),
    ...getGlowStyle()
  };

  return (
    <div
      className={`relative ${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      style={combinedStyle}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && (setIsHovered(false), setMousePosition({ x: 0, y: 0 }))}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => !disabled && setIsPressed(false)}
      onFocus={() => !disabled && setIsFocused(true)}
      onBlur={() => !disabled && setIsFocused(false)}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {children}
      
      {/* Ripple effects */}
      {type === 'click-ripple' && ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-0 h-0 bg-white/20 rounded-full animate-ping" 
               style={{ 
                 animation: 'ripple-expand 0.6s ease-out forwards',
                 width: '0px',
                 height: '0px'
               }} 
          />
        </div>
      ))}
      
      {/* Hover overlay */}
      {isHovered && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-inherit" />
      )}
      
      {/* Press overlay */}
      {isPressed && !disabled && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none rounded-inherit" />
      )}
    </div>
  );
};

// Specialized micro-interaction components
export const HoverLift: React.FC<Omit<MicroInteractionProps, 'type'>> = (props) => (
  <MicroInteraction {...props} type="hover-lift" />
);

export const ClickRipple: React.FC<Omit<MicroInteractionProps, 'type'>> = (props) => (
  <MicroInteraction {...props} type="click-ripple" />
);

export const FocusGlow: React.FC<Omit<MicroInteractionProps, 'type'>> = (props) => (
  <MicroInteraction {...props} type="focus-glow" />
);

export const Magnetic: React.FC<Omit<MicroInteractionProps, 'type'>> = (props) => (
  <MicroInteraction {...props} type="magnetic" />
);

export const Tilt: React.FC<Omit<MicroInteractionProps, 'type'>> = (props) => (
  <MicroInteraction {...props} type="tilt" />
);

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple-expand {
    0% {
      width: 0px;
      height: 0px;
      opacity: 0.5;
    }
    100% {
      width: 200px;
      height: 200px;
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

export default MicroInteraction;