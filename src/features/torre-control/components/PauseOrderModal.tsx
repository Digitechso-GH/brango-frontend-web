"use client";

import React, { useState } from "react";
import { usePauseOrderMutation } from "@/features/pedidos/hooks/usePedidosQueries";
import { toast } from "sonner";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface PauseOrderModalProps {
  order: any | null;
  onClose: () => void;
}

const COMMON_REASONS = [
  "Sin stock en almacén",
  "Solicitud del cliente (reprogramación)",
  "Dirección inubicable / Teléfono no responde",
  "Validación comercial pendiente",
  "Otro motivo",
];

export const PauseOrderModal: React.FC<PauseOrderModalProps> = ({ order, onClose }) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const pauseMutation = usePauseOrderMutation();

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === "Otro motivo"
        ? customNote.trim() || "Otro motivo no especificado"
        : customNote.trim()
        ? `${selectedReason}: ${customNote.trim()}`
        : selectedReason;

    try {
      await pauseMutation.mutateAsync({
        id: order.id,
        reason: finalReason,
      });
      toast.success(`Pedido #${order.code} puesto en pausa correctamente.`);
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "No se pudo pausar el pedido. Intente nuevamente.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1C1C28] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <IconAlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Pausar Pedido #{order.code}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Se retirará del mapa y de las rutas de despacho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              Motivo de la pausa
            </label>
            <div className="flex flex-col gap-1.5">
              {COMMON_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === r
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 font-semibold"
                      : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="pauseReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-amber-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              Nota o detalle adicional (opcional)
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ej: Stock ingresará el martes 08/09 por la mañana..."
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#2D2D3D]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pauseMutation.isPending}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {pauseMutation.isPending ? "Pausando..." : "Confirmar Pausa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
