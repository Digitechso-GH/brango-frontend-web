"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { toast } from "sonner";
import {
  IconBuilding,
  IconPlus,
  IconUserPlus,
  IconPencil,
  IconX,
  IconCheck,
  IconBan,
  IconSearch,
} from "@tabler/icons-react";

interface TenantRow {
  id: string;
  name: string;
  tradeName?: string | null;
  ruc: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  _count?: { users: number; orders: number; routes: number; drivers: number };
  users?: Array<{ id: string; name: string; email: string; active: boolean }>;
}

export default function EmpresasPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [managerDrawerTenant, setManagerDrawerTenant] = useState<TenantRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    tradeName: "",
    ruc: "",
  });

  const [form, setForm] = useState({
    name: "",
    tradeName: "",
    ruc: "",
    managerName: "",
    managerEmail: "",
    managerPassword: "",
  });

  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.TENANTS);
      const data = res.data?.data ?? res.data ?? [];
      setTenants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post(API_ENDPOINTS.TENANTS, form);
      toast.success("Empresa y gerente creados correctamente");
      setShowCreateDrawer(false);
      setForm({
        name: "",
        tradeName: "",
        ruc: "",
        managerName: "",
        managerEmail: "",
        managerPassword: "",
      });
      await loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear la empresa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant: TenantRow) => {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.patch(`${API_ENDPOINTS.TENANTS}/${tenant.id}`, { status: nextStatus });
      toast.success(
        nextStatus === "ACTIVE"
          ? "Empresa activada (accesos habilitados)"
          : "Empresa suspendida (accesos bloqueados en web y app)",
      );
      await loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al cambiar estado");
    }
  };

  const openEditTenant = (tenant: TenantRow) => {
    setEditingTenant(tenant);
    setEditForm({
      name: tenant.name,
      tradeName: tenant.tradeName || "",
      ruc: tenant.ruc,
    });
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      setSubmitting(true);
      await api.patch(`${API_ENDPOINTS.TENANTS}/${editingTenant.id}`, {
        name: editForm.name,
        tradeName: editForm.tradeName,
        ruc: editForm.ruc,
      });
      toast.success("Empresa actualizada correctamente");
      setEditingTenant(null);
      await loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar la empresa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerDrawerTenant) return;
    try {
      setSubmitting(true);
      await api.post(`${API_ENDPOINTS.TENANTS}/${managerDrawerTenant.id}/managers`, managerForm);
      toast.success("Gerente agregado a la empresa");
      setManagerDrawerTenant(null);
      setManagerForm({ name: "", email: "", password: "" });
      await loadTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear gerente");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const trade = (t.tradeName || "").toLowerCase();
      const ruc = (t.ruc || "").toLowerCase();
      const hasManager = t.users?.some(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
      return name.includes(q) || trade.includes(q) || ruc.includes(q) || Boolean(hasManager);
    });
  }, [tenants, search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconBuilding size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Empresas
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona las empresas contratantes de BranGO y sus accesos de Gerencia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreateDrawer(true)} className="rounded-xl">
            <IconPlus size={18} />
            <span>Nueva Empresa</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Buscador */}
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, RUC o gerente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
            />
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
            {filteredTenants.length} {filteredTenants.length === 1 ? "empresa" : "empresas"}
          </span>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Cargando empresas...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No se encontraron empresas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">RUC</th>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Usuarios</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                            <IconBuilding size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{t.tradeName || t.name}</p>
                            <p className="text-[11px] text-slate-400">{t.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">{t.ruc}</td>
                      <td className="py-3.5 px-4">
                        {t.users && t.users.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {t.users.map((u) => (
                              <span key={u.id} className="text-[11px] text-slate-600 dark:text-slate-300">
                                {u.email}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin correo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">
                        {t._count?.users ?? 0}
                      </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {t.status === "ACTIVE" ? "Activa" : "Suspendida"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditTenant(t)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 cursor-pointer"
                          title="Editar empresa"
                          aria-label="Editar empresa"
                        >
                          <IconPencil size={18} />
                        </button>
                        <button
                          onClick={() => setManagerDrawerTenant(t)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 cursor-pointer"
                          title="Agregar gerente"
                          aria-label="Agregar gerente"
                        >
                          <IconUserPlus size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={`transition-colors p-1.5 cursor-pointer ${
                            t.status === "ACTIVE"
                              ? "text-gray-400 hover:text-rose-600"
                              : "text-gray-400 hover:text-emerald-600"
                          }`}
                          title={t.status === "ACTIVE" ? "Suspender empresa" : "Activar empresa"}
                          aria-label={t.status === "ACTIVE" ? "Suspender empresa" : "Activar empresa"}
                        >
                          {t.status === "ACTIVE" ? <IconBan size={18} /> : <IconCheck size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Drawer Crear Empresa + Gerente */}
      {showCreateDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowCreateDrawer(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1A1A24] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registrar Nueva Empresa</h3>
                <p className="text-[11px] text-slate-400">Datos de la empresa y su gerente inicial</p>
              </div>
              <button
                onClick={() => setShowCreateDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Razón Social *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Transportes del Sur S.A.C."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre Comercial</label>
                <input
                  value={form.tradeName}
                  onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                  placeholder="Ej. TransSur"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">RUC *</label>
                <input
                  required
                  value={form.ruc}
                  onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                  placeholder="20XXXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-1 flex flex-col gap-3">
                <p className="font-bold text-slate-800 dark:text-slate-200">Primer Gerente de la Empresa</p>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre del Gerente *</label>
                  <input
                    required
                    value={form.managerName}
                    onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    value={form.managerEmail}
                    onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Contraseña inicial *</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={form.managerPassword}
                    onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                  />
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Crear Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer Editar Empresa */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setEditingTenant(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1A1A24] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Editar Empresa</h3>
                <p className="text-[11px] text-slate-400">
                  Corrige la Razón Social, Nombre Comercial o RUC
                </p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTenant} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Razón Social *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre Comercial</label>
                <input
                  value={editForm.tradeName}
                  onChange={(e) => setEditForm({ ...editForm, tradeName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">RUC *</label>
                <input
                  required
                  value={editForm.ruc}
                  onChange={(e) => setEditForm({ ...editForm, ruc: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer Agregar Gerente */}
      {managerDrawerTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setManagerDrawerTenant(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1A1A24] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nuevo Gerente</h3>
                <p className="text-[11px] text-slate-400">
                  {managerDrawerTenant.tradeName || managerDrawerTenant.name}
                </p>
              </div>
              <button
                onClick={() => setManagerDrawerTenant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateManager} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre completo *</label>
                <input
                  required
                  value={managerForm.name}
                  onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={managerForm.email}
                  onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={managerForm.password}
                  onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManagerDrawerTenant(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear Gerente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
