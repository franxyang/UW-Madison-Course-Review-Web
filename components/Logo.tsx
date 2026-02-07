import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

/**
 * MadSpace dual-color text logo.
 * "Mad" in UW crimson red, "Space" in dark slate.
 */
export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  // Scale font size relative to the size prop (32 → ~1.25rem)
  const fontSize = size * 0.625
  
  return (
    <span
      className={`inline-flex items-center font-extrabold tracking-tight select-none ${className}`}
      style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
    >
      <span className="text-wf-crimson">Mad</span>
      <span className="text-text-primary">Space</span>
    </span>
  )
}
