import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Estado para colapsar en PC
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Estado para abrir/cerrar en Móviles (offcanvas)
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      
      isMobileSidebarOpen: false,
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
    }),
    {
      name: 'brango-ui-storage', // Guarda en localStorage
      // Solo persistimos el estado de colapsado en PC. El menú móvil siempre inicia cerrado.
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    }
  )
);
