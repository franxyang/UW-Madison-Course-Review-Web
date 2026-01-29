import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Abstract 'W' Ribbon Structure */}
      <path
        d="M6 8L10 24L16 10L22 24L26 8"
        stroke="#c5050c"
        strokeWidth="0"
        fill="none"
      />
      
      {/* Left Stem / Shadow */}
      <path 
        d="M4 6C4 6 5.5 4 8 4C10 4 11 5 11 5L14 18L10 26L4 6Z" 
        fill="#9b0000" 
      />
      
      {/* Middle Connector */}
      <path 
        d="M14 18L17 9C17 9 18.5 7 21 7C23 7 24 8 24 8L21 18L14 18Z" 
        fill="#d93036" 
      />
      
      {/* Right Stem */}
      <path 
        d="M21 18L23 26L28 8C28 8 27 6 25 6C23 6 22 7 22 7L21 18Z" 
        fill="#c5050c" 
      />
      
      {/* Flow Accents */}
      <circle cx="10" cy="26" r="1.5" fill="#c5050c" />
      <circle cx="23" cy="26" r="1.5" fill="#c5050c" />
    </svg>
  );
};