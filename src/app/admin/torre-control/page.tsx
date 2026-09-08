"use client";

import React, { useState } from "react";
import { StatsSummary } from "@/features/torre-control/components/StatsSummary";
import { RouteBuilderPanel } from "@/features/torre-control/components/RouteBuilderPanel";
import { OrderSideList } from "@/features/torre-control/components/OrderSideList";
import { MapView } from "@/features/torre-control/components/MapView";
import { OrderDetailDrawer } from "@/features/pedidos/components/OrderDetailDrawer";

export default function TorreControlPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();
  const [focusedOrder, setFocusedOrder] = useState<any | null>(null);

  // Route Builder State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    setDrawerOpen(true);
  };

  const handleFocusOrder = (order: any) => {
    setFocusedOrder((prev: any) => prev?.id === order?.id ? null : order);
  };

  const handleSelectOrderForRoute = (orderId: string) => {
    if (!selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    }
  };

  const handleRemoveOrderFromRoute = (orderId: string) => {
    setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
  };

  const handleReorder = (newOrder: string[]) => {
    setSelectedOrderIds(newOrder);
  };

  const handleRouteSaved = () => {
    setSelectedOrderIds([]);
  };

  return (
    <div className="flex-1 flex flex-col gap-2 h-[calc(100vh-7.5rem)] max-h-[calc(100vh-7.5rem)] min-h-[520px] overflow-hidden">
      <StatsSummary />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        <div className="lg:col-span-3 h-full relative min-h-0">
          <MapView
            focusedOrder={focusedOrder}
            selectedOrderIds={selectedOrderIds}
            onSelectOrderForRoute={handleSelectOrderForRoute}
            onClearFocus={() => setFocusedOrder(null)}
          />

          {/* Panel Flotante del Route Builder */}
          <div className="absolute top-2.5 left-2.5 w-80 sm:w-84 md:w-92 max-w-[calc(100%-1.25rem)] h-[calc(100%-1.25rem)] z-10 pointer-events-none">
            <div className="pointer-events-auto w-full h-full shadow-2xl rounded-2xl">
              <RouteBuilderPanel
                selectedOrderIds={selectedOrderIds}
                onSelectOrder={handleSelectOrderForRoute}
                onRemoveOrder={handleRemoveOrderFromRoute}
                onReorder={handleReorder}
                onRouteSaved={handleRouteSaved}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 h-full overflow-hidden min-h-0">
          <OrderSideList onSelectOrder={handleSelectOrder} onFocusOrder={handleFocusOrder} />
        </div>
      </div>

      <OrderDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        orderId={activeOrderId}
      />
    </div>
  );
}
