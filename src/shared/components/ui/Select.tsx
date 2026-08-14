import React, { useState, useRef, useEffect } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import { FORM_CONTROL_BASE } from "./form-control";

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
  onClick?: () => void;
  placement?: "auto" | "top" | "bottom";
}

export const Select = ({
  options,
  value,
  onChange,
  className = "",
  error,
  icon,
  onClick,
  placement = "auto",
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
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

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={`relative ${isOpen ? 'z-[999]' : ''} ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`cursor-pointer ${FORM_CONTROL_BASE} flex items-center justify-between ${icon ? "pl-10 text-left" : "px-3.5 text-left"
          } hover:border-gray-300 dark:hover:border-gray-600 ${error ? "!border-red-500 !focus:ring-red-500/20 !focus:border-red-500" : ""
          }`}
      >
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <span className="truncate">{selectedOption?.label}</span>
        <IconChevronDown size={16} className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 w-full min-w-full bg-white dark:bg-[#181824] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2D2D3D] z-[9999] animate-in fade-in duration-150 p-1 max-h-60 overflow-y-auto custom-scrollbar ${openUpward
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
                className={`cursor-pointer w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <IconCheck size={16} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
      {error && (
        <p className="text-[10px] font-bold text-red-500 uppercase ml-1 tracking-wider mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
