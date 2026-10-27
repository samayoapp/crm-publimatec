import React from 'react';

interface PdfIconProps {
  className?: string;
}

/**
 * Ícono estilizado inconfundible de archivo PDF en color rojo oficial
 * con esquina doblada y texto 'PDF' en blanco negrita.
 */
export default function PdfIcon({ className = 'w-5 h-5' }: PdfIconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Base de la hoja roja */}
        <path
          d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
          fill="#DC2626"
        />

        {/* Doblez de la esquina superior derecha */}
        <path
          d="M14 2V7C14 7.55228 14.4477 8 15 8H20L14 2Z"
          fill="#EF4444"
        />

        {/* Borde sutil interno */}
        <path
          d="M6 3H13V7C13 8.10457 13.8954 9 15 9H19V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3Z"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.75"
        />

        {/* Texto 'PDF' en blanco negrita y tipografía limpia */}
        <text
          x="12"
          y="16.5"
          fill="#FFFFFF"
          fontSize="6.2"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
          letterSpacing="0.4"
        >
          PDF
        </text>
      </svg>
    </div>
  );
}
