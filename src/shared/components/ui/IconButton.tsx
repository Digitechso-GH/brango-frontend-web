import React from 'react';


export type IconButtonVariant = 'ghost' | 'outline' | 'danger' | 'success' | 'primary';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  icon: React.ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-transparent',
  outline: 'border-gray-200 text-gray-600 hover:bg-gray-50',
  danger: 'text-red-400 hover:text-red-600 hover:bg-red-50 border-transparent',
  success: 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 border-transparent',
  primary: 'bg-accent text-white hover:bg-accent/90 border-transparent',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`flex items-center justify-center w-8 h-8 rounded transition-colors cursor-pointer border ${variantStyles[variant]} ${className || ''}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
