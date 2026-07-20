"use client";

import React, { useState } from "react";
import { StatsSummary } from "@/features/torre-control/components/StatsSummary";
import { OrderSideList } from "@/features/torre-control/components/OrderSideList";
import { MapView } from "@/features/torre-control/components/MapView";
import { OrderDetailDrawer } from "@/features/pedidos/components/OrderDetailDrawer";

export default function TorreControlPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <StatsSummary />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-3">
          <MapView />
        </div>
        <div className="lg:col-span-1">
          <OrderSideList onSelectOrder={handleSelectOrder} />
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
