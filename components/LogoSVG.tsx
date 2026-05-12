import React from 'react';

interface LogoSVGProps {
  className?: string;
  theme?: "light" | "dark";
}

export default function LogoSVG({ className = "w-32 h-auto", theme = "light" }: LogoSVGProps) {
  const mainColor = theme === "dark" ? "#FFFFFF" : "#000000";
  const primaryColor = "#F7931E"; // Orange
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" className={className} fill="none">
       {/* 1. The Top Swoosh / Wing */}
       <path d="M 50 50 C 90 10, 150 30, 250 20 C 200 45, 150 40, 50 50 Z" fill={mainColor} />
       
       {/* 2. The Main MS Monogram Block with Masks */}
       <mask id="ms-mask">
          {/* Base curved block */}
          <path d="M 50 60 Q 150 90 250 60 L 250 180 Q 150 210 50 180 Z" fill="white" />
          
          {/* Cut: M Left Slit */}
          <rect x="75" y="82" width="20" height="150" fill="black" />
          {/* Cut: M Right Slit */}
          <rect x="120" y="87" width="20" height="150" fill="black" />
          
          {/* Cut: Gap between M and S */}
          <rect x="165" y="0" width="18" height="300" fill="black" />
          
          {/* Cut: S Top Cut (from right) */}
          <rect x="208" y="90" width="60" height="28" fill="black" />
          {/* Cut: S Bottom Cut (from left) */}
          <rect x="165" y="145" width="58" height="28" fill="black" />
       </mask>
       {/* Render the masked block */}
       <rect x="40" y="50" width="220" height="180" fill={mainColor} mask="url(#ms-mask)" />

       {/* 3. The Bottom Crescent (Smile) */}
       <path d="M 50 200 Q 150 235 250 200 Q 150 245 50 200 Z" fill={mainColor} />

       {/* 4. "For Programming" Arc Text */}
       <path id="text-curve" d="M 55 215 Q 150 255 245 215" fill="transparent" />
       <text>
          <textPath href="#text-curve" startOffset="50%" textAnchor="middle" fill={mainColor} fontWeight="900" fontFamily="Georgia, serif" fontSize="16" letterSpacing="0.5">
             For Programming
          </textPath>
       </text>

       {/* 5. Brand Name: Modern Soft */}
       <g transform="translate(150, 305)">
          <text textAnchor="middle" fontWeight="900">
             {/* The Orange 'M' */}
             <tspan fill={primaryColor} fontSize="58" fontFamily="Impact, sans-serif">M</tspan>
             <tspan fill={mainColor} fontSize="44" fontFamily="Georgia, serif">odern </tspan>
             {/* The Orange 'S' */}
             <tspan fill={primaryColor} fontSize="58" fontFamily="Impact, sans-serif">S</tspan>
             <tspan fill={mainColor} fontSize="44" fontFamily="Georgia, serif">oft</tspan>
          </text>
       </g>
    </svg>
  );
}
