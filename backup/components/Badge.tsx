import React from 'react';
import { GradeType } from '../types';
import { GRADE_COLORS, GRADE_BG_COLORS } from '../constants';

interface BadgeProps {
  grade?: GradeType;
  text?: string;
  variant?: 'solid' | 'outline' | 'subtle';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ grade, text, variant = 'solid', className = '' }) => {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";

  if (grade) {
    if (variant === 'solid') colorClass = GRADE_COLORS[grade];
    if (variant === 'subtle') colorClass = GRADE_BG_COLORS[grade];
  }

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-sm font-medium border ${grade && variant === 'solid' ? 'border-transparent' : ''} ${colorClass} ${className}`}>
      {text || grade}
    </span>
  );
};