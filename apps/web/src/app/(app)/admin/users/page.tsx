"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Users,
  Plus,
  Pencil,
  Shield,
  ShieldCheck,
  ChefHat,
  Search,
  KeyRound,
  UserCheck,
  UserX,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  ADMIN: { label: "Admin", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: ShieldCheck },
  CAJERO: { label: "Cajero", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Shield },
  COCINA: { label: "Cocina", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: ChefHat },
};

export default function UsersPage() {
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPw, setShowResetPw] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const token = getAccessToken();
      const data = await apiFetch<User[]>("/users", { token });
      setUsers(data);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggleActive = async (user: User) => {
    try {
      const token = getAccessToken();
      await apiFetch(`/users/${user.id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      await fetchUsers();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to toggle user status", err);
    }
  };

  if (loading) return <PageSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {t("users.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("users.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t("users.addUser")}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">{t("users.name")}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">{t("users.email")}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">{t("users.role")}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">{t("users.status")}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">{t("users.lastLogin")}</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">{t("users.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.CAJERO;
                const RIcon = rc.icon;
                return (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${rc.color}`}>
                        <RIcon className="w-3 h-3" />
                        {rc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${u.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {u.isActive ? t("users.active") : t("users.inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowForm(true);
                          }}
                          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title={t("users.edit")}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowResetPw(u.id)}
                          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title={t("users.resetPassword")}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-2 rounded-md hover:bg-muted transition-colors ${u.isActive ? "text-muted-foreground hover:text-red-500" : "text-muted-foreground hover:text-emerald-500"}`}
                          title={u.isActive ? t("users.deactivate") : t("users.activate")}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    {t("users.noUsers")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingUser(null);
            void fetchUsers();
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPw && (
        <ResetPasswordModal
          userId={showResetPw}
          onClose={() => setShowResetPw(null)}
        />
      )}
    </div>
  );
}

/* ─── User Form Modal ─────────────────────────────────── */

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEditing = !!user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "CAJERO");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = getAccessToken();
      if (isEditing) {
        await apiFetch(`/users/${user.id}`, {
          token,
          method: "PATCH",
          body: JSON.stringify({ name, role }),
        });
      } else {
        await apiFetch("/users", {
          token,
          method: "POST",
          body: JSON.stringify({ email, password, name, role }),
        });
      }
      onSaved();
    } catch (err: any) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      setError(err?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">
          {isEditing ? t("users.editUser") : t("users.addUser")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t("users.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {!isEditing && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("users.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("users.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
                <p className="text-[11px] text-muted-foreground mt-1">{t("users.passwordHint")}</p>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t("users.role")}</label>
            <div className="flex gap-2 mt-1.5">
              {(["ADMIN", "CAJERO", "COCINA"] as const).map((r) => {
                const rc = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all ${role === r ? "ring-2 ring-primary/50 " + rc.color : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    {rc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              {t("users.cancel")}
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "..." : isEditing ? t("users.save") : t("users.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Reset Password Modal ────────────────────────────── */

function ResetPasswordModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAccessToken();
      await apiFetch(`/users/${userId}/reset-password`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ newPassword: password }),
      });
      setDone(true);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          {t("users.resetPassword")}
        </h2>

        {done ? (
          <div className="text-center py-4">
            <p className="text-sm text-emerald-600 font-semibold">{t("users.passwordResetSuccess")}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg">
              {t("users.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">{t("users.newPassword")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{t("users.passwordHint")}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                {t("users.cancel")}
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
                {saving ? "..." : t("users.reset")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
