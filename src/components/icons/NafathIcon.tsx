import React from "react";

interface NafathIconProps {
  className?: string;
  size?: number;
}

/**
 * Nafath (نفاذ) brand icon - Saudi National Single Sign-On
 * Based on the official Nafath visual identity
 */
const NafathIcon: React.FC<NafathIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Nafath logo - stylized fingerprint/digital identity mark */}
      <g>
        {/* Outer arc - top */}
        <path
          d="M50 10C72.1 10 90 27.9 90 50"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Middle arc - right */}
        <path
          d="M70 50C70 61 61 70 50 70"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner arc - bottom left */}
        <path
          d="M30 50C30 38.95 38.95 30 50 30"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Center dot */}
        <circle cx="50" cy="50" r="6" fill="currentColor" />
        {/* Outer arc - bottom */}
        <path
          d="M50 90C27.9 90 10 72.1 10 50"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Connection line - top right */}
        <path
          d="M85 25L78 32"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Connection line - bottom left */}
        <path
          d="M15 75L22 68"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default NafathIcon;
