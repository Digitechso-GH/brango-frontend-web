"use client";

import { useState, useCallback } from "react";

export interface UseDrawerResult<T = any> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T | null) => void;
  close: () => void;
  toggle: () => void;
}

export const useDrawer = <T = any>(initialState = false): UseDrawerResult<T> => {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((drawerData: T | null = null) => {
    setData(drawerData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
};
