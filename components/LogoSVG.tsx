import React from 'react';

interface LogoSVGProps {
  className?: string;
  theme?: "light" | "dark";
}

export default function LogoSVG({ className = "w-32 h-auto", theme = "light" }: LogoSVGProps) {
  return (
    <img 
      src="/images/modern-soft-logo.png" 
      alt="Modern Soft" 
      draggable="false"
      className={`object-contain pointer-events-none select-none ${theme === 'dark' ? 'brightness-0 invert opacity-90' : ''} ${className}`}
    />
  );
}
