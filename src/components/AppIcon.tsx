
import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 1024, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="1024" height="1024" rx="230" fill="#C6FF00" />
      
      {/* Calendar base */}
      <rect x="200" y="250" width="624" height="524" rx="40" fill="white" stroke="#000000" strokeWidth="12" />
      
      {/* Calendar header */}
      <rect x="200" y="250" width="624" height="120" rx="40" fill="#000000" />
      <rect x="200" y="330" width="624" height="40" fill="#000000" />
      
      {/* Calendar rings */}
      <rect x="320" y="150" width="40" height="160" rx="20" fill="#000000" />
      <rect x="664" y="150" width="40" height="160" rx="20" fill="#000000" />
      
      {/* Calendar grid lines */}
      <line x1="304" y1="370" x2="304" y2="774" stroke="#E5E5E5" strokeWidth="2" />
      <line x1="408" y1="370" x2="408" y2="774" stroke="#E5E5E5" strokeWidth="2" />
      <line x1="512" y1="370" x2="512" y2="774" stroke="#E5E5E5" strokeWidth="2" />
      <line x1="616" y1="370" x2="616" y2="774" stroke="#E5E5E5" strokeWidth="2" />
      <line x1="720" y1="370" x2="720" y2="774" stroke="#E5E5E5" strokeWidth="2" />
      
      <line x1="200" y1="470" x2="824" y2="470" stroke="#E5E5E5" strokeWidth="2" />
      <line x1="200" y1="570" x2="824" y2="570" stroke="#E5E5E5" strokeWidth="2" />
      <line x1="200" y1="670" x2="824" y2="670" stroke="#E5E5E5" strokeWidth="2" />
      
      {/* Checkmark */}
      <circle cx="460" cy="520" r="60" fill="#C6FF00" stroke="#000000" strokeWidth="6" />
      <path
        d="M430 520 L450 540 L490 500"
        stroke="#000000"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Letter B in top corner */}
      <text
        x="280"
        y="320"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="60"
        fontWeight="bold"
        fill="#C6FF00"
        textAnchor="middle"
      >
        B
      </text>
    </svg>
  );
};

export default AppIcon;
