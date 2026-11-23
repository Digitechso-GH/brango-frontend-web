"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/routes";
import { toast } from "sonner";
import { IconUsers, IconBuilding, IconSearch } from "@tabler/icons-react";
import { Select } from "@/shared/components/ui/Select";

interface PlatformUserRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  role: { id: string; code: string; name: string };
  tenant: { id: string; name: string; tradeName?: string | null; ruc: string; status: string } | null;
}

interface TenantOption {
  id: string;
  name: string;
  tradeName?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  SYS_ADMIN: "Gerente",
  SYS_COORDINATOR: "Coordinador",
  SYS_OPERATOR: "Coordinador (Legacy)",
  SYS_DRIVER: "Chofer",
};

export default function PlataformaUsuariosPage() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, tenantsRes] = await Promise.all([
        api.get(`${API_ENDPOINTS.TENANTS}/users`, {
          params: selectedTenantId !== "all" ? { tenantId: selectedTenantId } : {},
        }),
        api.get(API_ENDPOINTS.TENANTS),
      ]);
      const usersData = usersRes.data?.data ?? usersRes.data ?? [];
      const tenantsData = tenantsRes.data?.data ?? tenantsRes.data ?? [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al cargar usuarios de plataforma");
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.tenant?.tradeName || u.tenant?.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconUsers size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Usuarios por Empresa
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Listado global de gerentes, coordinadores y choferes creados en cada empresa cliente.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Buscador y filtro */}
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-96">
              <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, correo o empresa..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
              />
            </div>
            <Select
              value={selectedTenantId}
              onChange={(val) => setSelectedTenantId(val)}
              options={[
                { label: "Todas las empresas", value: "all" },
                ...tenants.map((t) => ({
                  label: t.tradeName || t.name,
                  value: t.id,
                })),
              ]}
              variant="filter"
            />
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
            {filteredUsers.length} {filteredUsers.length === 1 ? "usuario" : "usuarios"}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No se encontraron usuarios.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Perfil / Rol</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                          <IconUsers size={14} />
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.tenant ? (
                        <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
                          <IconBuilding size={14} className="text-blue-600 shrink-0" />
                          <span>{u.tenant.tradeName || u.tenant.name}</span>
                          {u.tenant.status === "SUSPENDED" && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                              Suspendida
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px]">
                        {ROLE_LABELS[u.role.code] || u.role.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active && u.tenant?.status !== "SUSPENDED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {!u.active
                          ? "Inactivo"
                          : u.tenant?.status === "SUSPENDED"
                            ? "Bloqueado (Empresa)"
                            : "Activo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
