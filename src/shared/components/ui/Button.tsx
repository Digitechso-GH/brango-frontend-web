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
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20",
    secondary: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50",
    outline: "bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-xs",
    ghost: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5",
    danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/20",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs",
    md: "px-4.5 py-2.5 text-xs font-semibold sm:text-sm",
    lg: "px-6 py-3 text-sm font-semibold sm:text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
