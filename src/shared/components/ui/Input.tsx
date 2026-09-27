import React, { forwardRef } from "react";
import { FORM_CONTROL_BASE } from "./form-control";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, label, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-0.5 select-none">
            {typeof label === "string" && label.includes("*") ? (
              <>
                {label.split("*")[0]}
                <span className="text-red-500">*</span>
                {label.split("*")[1]}
              </>
            ) : (
              label
            )}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`${FORM_CONTROL_BASE} ${icon ? "pl-9" : "px-3.5"} ${
              error
                ? "!border-red-500 !focus:border-red-500 !focus:ring-red-500/20"
                : ""
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs font-normal text-red-500 ml-1 mt-0.5 animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
