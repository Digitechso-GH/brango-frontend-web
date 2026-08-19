import React from "react";

interface GPSBrandProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const GPSBrand: React.FC<GPSBrandProps> = ({ size = 16, className = "", ...props }) => {
  return (
    <svg 
      viewBox="0 0 100 120" 
      width={size} 
      height={size * 1.2} 
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M50 0C22.3858 0 0 22.3858 0 50C0 82.5 50 120 50 120C50 120 100 82.5 100 50C100 22.3858 77.6142 0 50 0Z" 
        fill="currentColor" 
      />
    </svg>
  );
};
