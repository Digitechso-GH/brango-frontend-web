import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:translate-y-px";
  
  const variants = {
    primary: "border border-transparent bg-accent text-white hover:bg-accent-dk active:bg-blue-700 shadow-sm hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)]",
    secondary: "border border-transparent bg-blue-50 dark:bg-blue-900/30 text-accent dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:bg-blue-200",
    outline: "bg-white dark:bg-transparent border border-gray-200 dark:border-[#2D2D3D] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 hover:text-gray-900 dark:hover:text-white shadow-sm transition-colors",
    ghost: "border border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 active:bg-gray-200 transition-colors",
    danger: "border border-transparent bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)]",
  };

  // py + line-height de la clase text = altura total predecible:
  // sm:  py-2  (8) + text-xs line-h (16) + py-2  (8) = 32px  → alinea con inputs
  // md:  py-2.5(10) + text-sm line-h (20) + py-2.5(10) = 40px → acciones principales
  // lg:  py-3  (12) + text-base line-h(24) + py-3  (12) = 48px → CTAs destacados
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
