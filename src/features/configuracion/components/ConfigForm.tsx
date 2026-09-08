import React, { useState, useEffect } from "react";
import { Input } from "@/shared/components/ui/Input";
import { Toggle } from "@/shared/components/ui/Toggle";
import { Button } from "@/shared/components/ui/Button";
import api from "@/shared/api/axios";
import axios from "axios";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export const ConfigForm = () => {
  const [pingOption, setPingOption] = useState<"5s" | "1m" | "2m">("5s");
  const [eta, setEta] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [whatsappImage, setWhatsappImage] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get(`${API_ENDPOINTS.ORDERS}/config`);
        const conf = res.data.data || res.data;
        if (conf.gps_ping_interval) setPingOption(conf.gps_ping_interval as any);
        if (conf.auto_messages) setEta(conf.auto_messages === "true");
        if (conf.whatsapp_logo_url) setWhatsappImage(conf.whatsapp_logo_url);
        if (conf.whatsapp_admin_phone) setAdminPhone(conf.whatsapp_admin_phone);
      } catch (e) {
        console.error("Error loading config", e);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await api.put(`${API_ENDPOINTS.ORDERS}/config`, {
        gps_ping_interval: pingOption,
        auto_messages: eta ? "true" : "false",
        whatsapp_logo_url: whatsappImage || "",
        whatsapp_admin_phone: adminPhone
      });
      toast.success("Configuración guardada correctamente");
    } catch (e) {
      console.error("Error saving config", e);
      toast.error("Error guardando configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Pedir URL firmada al backend (usamos clave estática para que R2 la sobreescriba y no se acumule)
      const extension = file.name.split('.').pop();
      const res = await api.post(`${API_ENDPOINTS.ORDERS}/presigned-url`, {
        key: `company-logo-current.${extension}`,
        contentType: file.type,
      });
      const { uploadUrl, publicUrl } = res.data.data;

      // 2. Subir directamente a Cloudflare R2 usando raw axios
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
      });

      // 3. Guardar la URL pública con un parámetro de versión para romper la caché del navegador
      const publicUrlWithBuster = `${publicUrl}?v=${Date.now()}`;
      setWhatsappImage(publicUrlWithBuster);
    } catch (error: any) {
      console.error("Error subiendo la imagen", error);
      toast.error(`Error subiendo la imagen: ${error.message || "Revisa la consola"}`);
    } finally {
      setUploading(false);
    }
  };

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
            placeholder="Ej. +51 987 654 321" 
            value={adminPhone}
            onChange={(e) => setAdminPhone(e.target.value)}
          />
        </div>

        {/* Carga de Imagen para WhatsApp */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Logo para Whatsapp</h4>
          <p className="text-xs text-gray-500 mb-2">Sube una imagen para acompañar las notificaciones enviadas a los clientes.</p>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-sm font-semibold py-2 px-4 rounded-lg transition-colors text-gray-700 dark:text-gray-200">
              {uploading ? "Subiendo a Cloudflare..." : "Seleccionar Imagen"}
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {whatsappImage && (
              <div className="flex items-center gap-3 ml-2 border border-gray-200 dark:border-[#3D3D4D] rounded-lg p-1 bg-white dark:bg-[#1A1A24]">
                <img src={whatsappImage} alt="Logo Whatsapp" className="w-12 h-12 object-cover rounded-md" />
                <a href={whatsappImage} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline px-2">
                  Ver URL
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GPS Ping Card */}
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1 mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Frecuencia de ping GPS (App del Chofer)</h3>
          <p className="text-xs text-gray-500">Intervalo de envío de ubicación en segundo plano. Un intervalo mayor ahorra batería y datos móviles; uno menor da más precisión al mapa histórico.</p>
        </div>

        {/* Opción 5 Segundos (Testeo en vivo) */}
        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">⚡ Cada 5 segundos (Modo Testeo / Prueba en vivo)</span>
            <span className="text-xs text-gray-500">Máxima fluidez en mapa para pruebas directas.</span>
          </div>
          <Toggle checked={pingOption === "5s"} onChange={() => setPingOption("5s")} />
        </div>

        {/* Opción 1 Minuto */}
        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Cada 1 minuto</span>
            <span className="text-xs text-gray-500">Mayor precisión, mayor consumo.</span>
          </div>
          <Toggle checked={pingOption === "1m"} onChange={() => setPingOption("1m")} />
        </div>

        {/* Opción 2 Minutos */}
        <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Cada 2 minutos (recomendado)</span>
            <span className="text-xs text-gray-500">Balance entre precisión y batería.</span>
          </div>
          <Toggle checked={pingOption === "2m"} onChange={() => setPingOption("2m")} />
        </div>
      </div>

      {/* Mensajes Automáticos Card - Deshabilitado / Sin utilidad actual
      <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Mensajes automáticos al cliente final</h3>
          <p className="text-xs text-gray-500">Enviar plantilla automática de WhatsApp cuando el chofer marque "En camino".</p>
        </div>
        <Toggle checked={eta} onChange={setEta} />
      </div>
      */}

      <div className="flex justify-end mt-4">
        <Button 
          variant="primary" 
          onClick={handleSaveConfig} 
          disabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
};
