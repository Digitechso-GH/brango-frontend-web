"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { APP_THEMES } from "@/shared/constants/map-config";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 opacity-50 cursor-default">
        <IconSun size={20} className="text-gray-400" />
        Cambiando Tema...
      </button>
    );
  }

  const isDark = theme === APP_THEMES.DARK;

  return (
    <button
      onClick={() => setTheme(isDark ? APP_THEMES.LIGHT : APP_THEMES.DARK)}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors group"
    >
      {isDark ? (
        <IconSun size={20} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      ) : (
        <IconMoon size={20} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      )}
      <span className="text-sm font-medium">
        {isDark ? "Modo Claro" : "Modo Oscuro"}
      </span>
    </button>
  );
}
