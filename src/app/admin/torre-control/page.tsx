"use client";

import React, { useState } from "react";
import { StatsSummary } from "@/features/torre-control/components/StatsSummary";
import { OrderSideList } from "@/features/torre-control/components/OrderSideList";
import { MapView } from "@/features/torre-control/components/MapView";
import { OrderDetailDrawer } from "@/features/pedidos/components/OrderDetailDrawer";

export default function TorreControlPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();
  const [focusedOrder, setFocusedOrder] = useState<any | null>(null);

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    setDrawerOpen(true);
  };

  const handleFocusOrder = (order: any) => {
    setFocusedOrder(order);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <StatsSummary />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 h-full">
          <MapView focusedOrder={focusedOrder} />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
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
