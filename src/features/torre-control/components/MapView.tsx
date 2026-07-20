import React from "react";
import { IconMapPinFilled } from "@tabler/icons-react";

export const MapView = () => {
  return (
    <div className="bg-gray-100 dark:bg-[#20202A] h-full min-h-[500px] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>
      
      <div className="text-center z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-white dark:bg-[#1A1A24] rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-[#2D2D3D] text-accent animate-bounce">
          <IconMapPinFilled size={32} />
        </div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
          Mapa de Google Maps (Simulado)
        </p>
      </div>

      {/* Mock Drivers on map */}
      <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-accent rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-[10px]">
        CH1
      </div>
      <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-[10px]">
        CH2
      </div>
    </div>
  );
};
