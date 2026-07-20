import React, { useState } from "react";
import { Input } from "@/shared/components/ui/Input";
import { Toggle } from "@/shared/components/ui/Toggle";

export const ConfigForm = () => {
  const [ping1, setPing1] = useState(false);
  const [ping2, setPing2] = useState(true);
  const [eta, setEta] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Configuración</h2>
        <p className="text-sm font-medium text-gray-500">Notificaciones, GPS e integraciones</p>
      </div>

      {/* WhatsApp Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp Business - Facturación</h3>
          <p className="text-xs text-gray-500">Número que recibe el aviso automático con la foto de la guía firmada al confirmarse una entrega.</p>
        </div>
        <div className="max-w-xs mt-2">
          <Input 
            label="Número de WhatsApp" 
            placeholder="+51 987 000 111" 
            defaultValue="+51 987 000 111" 
          />
        </div>
      </div>

      {/* GPS Ping Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1 mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Frecuencia de ping GPS (App del Chofer)</h3>
          <p className="text-xs text-gray-500">Intervalo de envío de ubicación en segundo plano. Un intervalo mayor ahorra batería y datos móviles; uno menor da más precisión al mapa histórico.</p>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Cada 1 minuto</span>
            <span className="text-xs text-gray-500">Mayor precisión, mayor consumo</span>
          </div>
          <Toggle checked={ping1} onChange={(val) => { setPing1(val); if (val) setPing2(false); }} />
        </div>

        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Cada 2 minutos (recomendado)</span>
            <span className="text-xs text-gray-500">Balance entre precisión y batería</span>
          </div>
          <Toggle checked={ping2} onChange={(val) => { setPing2(val); if (val) setPing1(false); }} />
        </div>
      </div>

      {/* Mensajes Automáticos Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Mensajes automáticos al cliente final</h3>
          <p className="text-xs text-gray-500">Enviar plantilla automática de WhatsApp cuando el chofer marque "En camino".</p>
        </div>
        <Toggle checked={eta} onChange={setEta} />
      </div>
    </div>
  );
};
