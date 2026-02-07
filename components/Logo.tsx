import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

/**
 * MadSpace logo: #MadSpace.|
 * # in red, Mad in dark, Space in gray, . red dot, | blinking orange cursor
 */
export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  const fontSize = size * 0.625
  
  return (
    <span
      className={`inline-flex items-baseline font-extrabold tracking-tight select-none ${className}`}
      style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
    >
      <span className="text-wf-crimson">#</span>
      <span className="text-text-primary">Mad</span>
      <span className="text-text-tertiary">Space</span>
      <span className="text-wf-crimson text-[0.6em]">.</span>
      <span className="text-orange-500 font-light animate-blink">|</span>
    </span>
  )
}
