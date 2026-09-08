import React, { useState, useRef, useEffect } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: React.ReactNode;
  icon?: React.ReactNode;
  placeholder?: string;
  onClick?: () => void;
  placement?: "auto" | "top" | "bottom";
  disabled?: boolean;
  variant?: "default" | "filter" | "pill";
  size?: "sm" | "md" | "lg";
}

export const Select = ({
  options,
  value,
  onChange,
  className = "",
  error,
  icon,
  placeholder = "Seleccionar opción",
  onClick,
  placement = "auto",
  disabled = false,
  variant = "default",
  size = "md",
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      if (placement === "top") {
        setOpenUpward(true);
      } else if (placement === "bottom") {
        setOpenUpward(false);
      } else {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 220);
      }
    }
    setIsOpen(!isOpen);
    if (onClick) onClick();
  };

  const selectedOption = options.find((opt) => opt.value === value);

  // Styling based on variant and size
  const isFilter = variant === "filter" || variant === "pill";
  const isSmall = size === "sm";

  const containerClasses = isFilter
    ? "bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-[#181824] transition-all"
    : isSmall
      ? "w-full py-1.5 bg-slate-50/60 focus:bg-white dark:bg-[#13131A] dark:focus:bg-[#181824] border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
      : "w-full py-2.5 bg-slate-50/60 focus:bg-white dark:bg-[#13131A] dark:focus:bg-[#181824] border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-700 transition-all";

  const sizePadding = isFilter
    ? icon ? "pl-8 pr-2.5" : "px-3"
    : isSmall
      ? icon ? "pl-7 pr-2.5" : "px-2.5"
      : icon ? "pl-10 pr-3.5" : "px-3.5";

  return (
    <div className={`relative inline-block ${variant === "default" ? "w-full" : ""} ${isOpen ? "z-[999]" : ""} ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full cursor-pointer flex items-center justify-between gap-2 text-left select-none relative ${containerClasses} ${sizePadding} ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800" : ""
        } ${error ? "!border-red-500 !focus:ring-red-500/20 !focus:border-red-500" : ""}`}
      >
        {icon && (
          <div className={`absolute ${isSmall ? "left-2" : "left-2.5"} top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center`}>
            {icon}
          </div>
        )}
        
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <IconChevronDown
          size={isFilter || isSmall ? 13 : 16}
          className={`text-slate-400 dark:text-slate-500 shrink-0 ml-1 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 min-w-full w-max max-w-xs bg-white dark:bg-[#1A1A24] rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-200/90 dark:border-slate-800 z-[9999] animate-in fade-in zoom-in-95 duration-150 p-1 max-h-64 overflow-y-auto custom-scrollbar ${
            openUpward
              ? "bottom-[100%] mb-1.5 slide-in-from-bottom-2"
              : "top-[100%] mt-1.5 slide-in-from-top-2"
          }`}
        >
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`cursor-pointer w-full flex items-center justify-between gap-3 px-2.5 py-1.5 text-left ${
                  isFilter || isSmall ? "text-xs" : "text-sm"
                } font-medium rounded-lg transition-all ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <IconCheck size={14} className="shrink-0 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-[11px] font-medium text-red-500 ml-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
