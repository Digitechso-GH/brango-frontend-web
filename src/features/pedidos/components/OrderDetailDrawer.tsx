import React from "react";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { IconMapPin, IconMapPinFilled, IconReceipt, IconClock, IconCheck, IconPhoto } from "@tabler/icons-react";

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const OrderDetailDrawer = ({ isOpen, onClose, orderId }: OrderDetailDrawerProps) => {
  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        {/* Header Info */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Bodega San Martín E.I.R.L.</h2>
          <p className="text-sm font-bold text-gray-500">Guía #{orderId || "004521"}</p>
        </div>

        <div>
          <Badge variant="warning">
            <IconMapPinFilled size={12} />
            En camino - Unidad 02
          </Badge>
        </div>

        {/* Foto ePOD Placeholder */}
        <div className="w-full h-48 bg-gray-100 dark:bg-[#13131A] rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] flex flex-col items-center justify-center gap-2 text-gray-400">
          <IconReceipt size={32} className="text-gray-300 dark:text-gray-500" />
          <span className="text-xs font-bold">Foto ePOD disponible al confirmarse la entrega</span>
        </div>

        {/* Data List */}
        <div className="flex flex-col border-t border-gray-100 dark:border-[#2D2D3D]">
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
            <span className="text-sm font-medium text-gray-500">Cliente</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Bodega San Martín E.I.R.L.</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
            <span className="text-sm font-medium text-gray-500 shrink-0">Dirección</span>
            <div className="flex items-center gap-2 text-right">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Av. Colonial 1450, Callao</span>
              <button 
                title="Validar Coordenadas"
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <IconMapPin size={14} stroke={2.5} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
            <span className="text-sm font-medium text-gray-500">Teléfono</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">+51 987 654 321</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
            <span className="text-sm font-medium text-gray-500">Chofer asignado</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">M. Torres — Unidad 02</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Línea de tiempo</h3>
          
          <div className="relative pl-6 flex flex-col gap-6">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100 dark:bg-[#2D2D3D]"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-white dark:bg-[#1A1A24] p-0.5 z-10">
                <IconMapPinFilled size={18} className="text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Pedido registrado</span>
                <span className="text-xs font-medium text-gray-400">08:15 · carga masiva</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-white dark:bg-[#1A1A24] p-0.5 z-10">
                <IconMapPinFilled size={18} className="text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Asignado a Unidad 02</span>
                <span className="text-xs font-medium text-gray-400">08:20</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-white dark:bg-[#1A1A24] p-0.5 z-10">
                <IconMapPinFilled size={18} className="text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">En camino — WhatsApp enviado al cliente</span>
                <span className="text-xs font-medium text-gray-400">14:32</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-[30px] top-0.5 bg-white dark:bg-[#1A1A24] p-0.5 z-10">
                <IconMapPin size={18} className="text-gray-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Entrega + ePOD</span>
                <span className="text-xs font-medium text-gray-400">Pendiente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-[#2D2D3D]">
          <Button variant="outline" size="sm" className="flex-1 py-1.5 px-3 h-8 text-[11px]">Reenviar WhatsApp</Button>
          <Button variant="ghost" size="sm" className="flex-1 py-1.5 px-3 h-8 text-[11px]">Reasignar unidad</Button>
        </div>
      </div>
    </BaseDrawer>
  );
};
