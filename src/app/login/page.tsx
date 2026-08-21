"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { ROUTES } from "@/shared/constants/routes";
import { IconMail, IconLock, IconArrowRight, IconLoader2 } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const { token, setAuth, hasHydrated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir si ya tiene sesión activa (solo después de hidratar)
  useEffect(() => {
    if (hasHydrated && token) {
      router.replace(ROUTES.ADMIN.TORRE_CONTROL);
    }
  }, [hasHydrated, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Por favor, ingrese su correo y contraseña");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      setAuth(res.token, res.refreshToken, res.user);
      toast.success(`¡Bienvenido de nuevo, ${res.user.name}!`);
      router.replace(ROUTES.ADMIN.TORRE_CONTROL);
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.response?.data?.message || "Credenciales incorrectas. Verifique e intente nuevamente.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Ambient Light Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-[100px] pointer-events-none opacity-70" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] pointer-events-none opacity-70" />

      {/* Main Light Theme Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/60 relative z-10 flex flex-col gap-6">
        
        {/* Header: Logo SVG Official & Typography */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="flex items-center justify-center mb-1">
            <img src="/icon.svg" alt="BranGo Pin Logo" className="w-12 h-14 drop-shadow-sm" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-blue-600">
            Bran<span className="text-slate-900">Go</span>
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          
          {/* Campo: Correo Electrónico */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <IconMail size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <IconLock size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <IconLoader2 size={18} className="animate-spin" />
                Validando...
              </>
            ) : (
              <>
                Ingresar al Sistema
                <IconArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 font-medium pt-3 border-t border-slate-100">
          &copy; {new Date().getFullYear()} BranGo Logistics. Todos los derechos reservados.
        </div>

      </div>
    </div>
  );
}
