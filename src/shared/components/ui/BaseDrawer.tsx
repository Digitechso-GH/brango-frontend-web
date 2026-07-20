"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";

interface BaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  /** @deprecated Usar maxWidth en su lugar. Se acepta para compatibilidad pero no tiene efecto. */
  size?: string;
  zIndex?: number;
}

export const BaseDrawer = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer,
  maxWidth = "sm:max-w-[420px]",
  zIndex = 9999
}: BaseDrawerProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 overflow-hidden flex justify-end"
      style={{ zIndex }}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel: w-full por defecto (mobile), maxWidth en sm+ */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-[#1A1A24] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-gray-100 dark:border-[#2D2D3D] transition-colors duration-300`}>
        
        {/* Floating Close Button if no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-full transition-all z-10"
          >
            <IconX size={20} />
          </button>
        )}

        {/* Header (Optional) */}
        {title && (
          <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#2D2D3D] rounded-full transition-all"
            >
              <IconX size={20} />
            </button>
          </div>
        )}

        {/* Content con overflow-y-auto */}
        <div className={`flex-1 overflow-y-auto ${title ? 'p-8 pt-6' : 'p-8 pt-12'} custom-scrollbar`}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24] transition-colors duration-300 p-5 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
