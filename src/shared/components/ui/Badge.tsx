import React from "react";

export type BadgeVariant = "success" | "danger" | "warning" | "info" | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  success: {
    container: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
    dot: "bg-emerald-500",
  },
  danger: {
    container: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40",
    dot: "bg-rose-500",
  },
  warning: {
    container: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40",
    dot: "bg-amber-500",
  },
  info: {
    container: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
    dot: "bg-blue-500",
  },
  default: {
    container: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", withDot = false, children, ...props }, ref) => {
    const style = variantStyles[variant] || variantStyles.default;
    return (
      <div
        ref={ref}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${style.container} ${className}`}
        {...props}
      >
        {withDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";
