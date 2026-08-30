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
  maxWidth = "sm:max-w-[440px]",
  zIndex = 9999
}: BaseDrawerProps) => {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleAnimationEnd = (e: React.TransitionEvent) => {
    if (e.target === e.currentTarget && !isOpen) {
      setShouldRender(false);
    }
  };

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 overflow-hidden flex justify-end transition-opacity duration-300 ease-out ${isAnimating ? "opacity-100" : "opacity-0"}`}
      style={{ zIndex }}
      onTransitionEnd={handleAnimationEnd}
    >
      {/* Overlay sólido/semi-transparente sin blur */}
      <div
        className="absolute inset-0 bg-gray-900/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#1A1A24] shadow-2xl flex flex-col h-full sm:rounded-l-3xl border-l border-slate-200/80 dark:border-slate-800 transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Floating Close Button if no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all z-10 cursor-pointer"
          >
            <IconX size={18} />
          </button>
        )}

        {/* Header */}
        {title && (
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <IconX size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${title ? 'p-6' : 'p-6 pt-12'} custom-scrollbar`}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1A1A24] transition-colors p-5 sm:rounded-bl-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
