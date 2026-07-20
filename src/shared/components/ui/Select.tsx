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
  onClick?: () => void;
}

export const Select = ({
  options,
  value,
  onChange,
  className = "",
  error,
  onClick,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={`relative ${isOpen ? 'z-[999]' : ''} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (onClick) onClick();
        }}
        className={`cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-[#1A1A24] border rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-sm uppercase group ${
          error ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 dark:border-[#2D2D3D]"
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <IconChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[100%] mt-1 w-full min-w-full bg-white dark:bg-[#1A1A24] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-[#2D2D3D] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 p-1 max-h-60 overflow-y-auto custom-scrollbar">
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
                className={`cursor-pointer w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold rounded-lg transition-colors uppercase ${
                  isSelected 
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <IconCheck size={14} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
      {error && (
        <p className="text-[9px] font-bold text-red-500 uppercase ml-1 tracking-wider mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
