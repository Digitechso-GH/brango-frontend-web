"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { toast } from "sonner";
import {
  IconUsers,
  IconPlus,
  IconX,
  IconPencil,
  IconCheck,
  IconBan,
  IconSearch,
} from "@tabler/icons-react";

interface TenantUserRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  role: { id: string; code: string; name: string };
}

const ROLE_BADGE: Record<string, string> = {
  SYS_ADMIN: "Gerente",
  SYS_COORDINATOR: "Coordinador",
  SYS_OPERATOR: "Coordinador (Legacy)",
  SYS_DRIVER: "Chofer",
};

export default function UsuariosPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleCode: ROLES.SYS_COORDINATOR as string,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ENDPOINTS.USERS);
      const data = res.data?.data ?? res.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", roleCode: ROLES.SYS_COORDINATOR });
    setShowModal(true);
  };

  const openEdit = (u: TenantUserRow) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      roleCode: u.role.code === ROLES.SYS_OPERATOR ? ROLES.SYS_COORDINATOR : u.role.code,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingUser) {
        await api.patch(`${API_ENDPOINTS.USERS}/${editingUser.id}`, {
          name: form.name,
          roleCode: form.roleCode,
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        await api.post(API_ENDPOINTS.USERS, form);
        toast.success("Usuario creado correctamente");
      }
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: TenantUserRow) => {
    try {
      await api.patch(`${API_ENDPOINTS.USERS}/${u.id}`, { active: !u.active });
      toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar estado");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const roleLabel = (ROLE_BADGE[u.role.code] || u.role.name).toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        roleLabel.includes(q)
      );
    });
  }, [users, search]);

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
              Usuarios y Accesos
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administra los Coordinadores, Gerentes y Choferes de tu empresa ({currentUser?.tenantName || "Empresa"}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreate} className="rounded-xl">
            <IconPlus size={18} />
            <span>Nuevo Usuario</span>
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
              placeholder="Buscar por nombre, correo o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
            />
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
            {filteredUsers.length} {filteredUsers.length === 1 ? "usuario" : "usuarios"}
          </span>
        </div>

        {/* Tabla */}
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
                    <th className="py-3 px-4">Perfil / Rol</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                        <IconUsers size={14} />
                      </div>
                      {u.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px]">
                        {ROLE_BADGE[u.role.code] || u.role.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {u.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 cursor-pointer"
                          title="Editar usuario"
                          aria-label="Editar usuario"
                        >
                          <IconPencil size={18} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`transition-colors p-1.5 cursor-pointer ${
                              u.active
                                ? "text-gray-400 hover:text-rose-600"
                                : "text-gray-400 hover:text-emerald-600"
                            }`}
                            title={u.active ? "Desactivar usuario" : "Activar usuario"}
                            aria-label={u.active ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {u.active ? <IconBan size={18} /> : <IconCheck size={18} />}
                          </button>
                        )}
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A24] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nombre completo *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                  />
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Perfil / Rol *</label>
                <Select
                  value={form.roleCode}
                  onChange={(val) => setForm({ ...form, roleCode: val })}
                  options={[
                    { label: "Coordinador (Operación)", value: ROLES.SYS_COORDINATOR },
                    { label: "Gerente (Operación + Accesos)", value: ROLES.SYS_ADMIN },
                    ...(editingUser?.role.code === ROLES.SYS_DRIVER
                      ? [{ label: "Chofer (Móvil)", value: ROLES.SYS_DRIVER }]
                      : []),
                  ]}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  {editingUser ? "Nueva contraseña (opcional)" : "Contraseña *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={4}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? "Dejar vacío para mantener la actual" : ""}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#13131A]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingUser ? "Actualizar" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
