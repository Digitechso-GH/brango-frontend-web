"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { ROUTES } from "@/shared/constants/routes";

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      if (token) {
        router.replace(ROUTES.ADMIN.TORRE_CONTROL);
      } else {
        router.replace(ROUTES.LOGIN);
      }
    }
  }, [hasHydrated, token, router]);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-[#0F0F17] flex items-center justify-center text-slate-400 text-sm font-sans">
      Cargando BranGo...
    </div>
  );
}
