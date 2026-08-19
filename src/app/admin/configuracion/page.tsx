"use client";

import React from "react";
import { ConfigForm } from "@/features/configuracion/components/ConfigForm";

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <ConfigForm />
    </div>
  );
}
