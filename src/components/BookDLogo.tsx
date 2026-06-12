import React from 'react';
import { Sparkles } from 'lucide-react';

interface BookDLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSparkle?: boolean;
  className?: string;
}

const BookDLogo: React.FC<BookDLogoProps> = ({ 
  size = 'md', 
  showSparkle = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl md:text-3xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl lg:text-7xl'
  };

  const sparkleClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4 md:w-5 md:h-5',
    lg: 'w-5 h-5 md:w-6 md:h-6',
    xl: 'w-6 h-6 md:w-7 md:h-7'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showSparkle && (
        <Sparkles 
          className={`${sparkleClasses[size]} text-primary animate-pulse`} 
        />
      )}
      <div 
        className={`font-cursive ${sizeClasses[size]} font-bold text-primary relative`}
        style={{
          fontFamily: 'Pacifico, cursive',
          filter: 'drop-shadow(0 2px 4px rgba(42, 157, 143, 0.35))'
        }}
      >
        Evently
        {showSparkle && (
          <span 
            className="absolute -top-1 -right-2 text-xs animate-sparkle-twinkle"
            style={{ fontSize: size === 'sm' ? '0.5rem' : size === 'md' ? '0.75rem' : '1rem' }}
          >
            ✨
          </span>
        )}
      </div>
    </div>
  );
};

export default BookDLogo;