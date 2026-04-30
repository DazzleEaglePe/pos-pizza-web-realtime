"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BadgeCheck,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Mail,
  Save,
  Settings,
  Shield,
  Store,
  Ticket,
  UserRound,
} from "lucide-react";
import { AdminPageHeader } from "@pos-pizza/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { API_URL } from "@/lib/config";
import { useConfig } from "@/hooks/useConfig";
import { locales, localeNames, type Locale, useTranslation } from "@/i18n";
import { posAlert } from "@/lib/sweetalert";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PhoneInput } from "@/components/ui/phone-input";
import { CurrencySelect } from "@/components/ui/currency-select";

type BusinessConfig = {
  id: string;
  companyName: string;
  ruc: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxRateDefault: number;
  currency: string;
  timezone: string;
  ticketHeader: string | null;
  ticketFooter: string | null;
  trackingBaseUrl: string | null;
  trackingExpiryHours: number;
  logoUrl: string | null;
};

type BusinessConfigForm = Omit<
  BusinessConfig,
  | "ruc"
  | "address"
  | "phone"
  | "email"
  | "ticketHeader"
  | "ticketFooter"
  | "trackingBaseUrl"
  | "logoUrl"
> & {
  ruc: string;
  address: string;
  phone: string;
  email: string;
  ticketHeader: string;
  ticketFooter: string;
  trackingBaseUrl: string;
  logoUrl: string;
};

type ProfileResponse = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type SectionId =
  | "business"
  | "ticket"
  | "account"
  | "security"
  | "branding"
  | "language";

type SettingsSection = {
  id: SectionId;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "business",
    title: "Negocio",
    subtitle: "Datos fiscales y operativos",
    icon: Store,
  },
  {
    id: "ticket",
    title: "Ticket & Tracking",
    subtitle: "Textos y expiración",
    icon: Ticket,
  },
  {
    id: "account",
    title: "Cuenta",
    subtitle: "Nombre y correo",
    icon: UserRound,
  },
  {
    id: "security",
    title: "Seguridad",
    subtitle: "Cambio de contraseña",
    icon: Shield,
  },
  {
    id: "branding",
    title: "Marca",
    subtitle: "Logo de la empresa",
    icon: ImageIcon,
  },
  {
    id: "language",
    title: "Idioma & Región",
    subtitle: "Preferencia global",
    icon: Globe,
  },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { locale, setLocale } = useTranslation();
  const setTaxRate = useConfig((s) => s.setTaxRate);
  const setCurrency = useConfig((s) => s.setCurrency);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("business");
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [businessForm, setBusinessForm] = useState<BusinessConfigForm>({
    id: "",
    companyName: "POS Pizza",
    ruc: "",
    address: "",
    phone: "",
    email: "",
    taxRateDefault: 18,
    currency: "PEN",
    timezone: "America/Lima",
    ticketHeader: "",
    ticketFooter: "",
    trackingBaseUrl: "",
    trackingExpiryHours: 2,
    logoUrl: "",
  });

  const logoPreviewUrl = useMemo(() => {
    const value = businessForm.logoUrl?.trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
  }, [businessForm.logoUrl]);

  const resetSessionAndRedirectToLogin = useCallback(async () => {
    localStorage.removeItem("pos_access_token");
    localStorage.removeItem("pos_user");
    document.cookie =
      "pos_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    router.replace("/login");
  }, [router]);

  const fetchInitialData = useCallback(async () => {
    try {
      const token = getAccessToken();
      const [config, currentProfile] = await Promise.all([
        apiFetch<BusinessConfig>("/config/full", { token }),
        apiFetch<ProfileResponse>("/auth/profile", { token }),
      ]);

      setBusinessForm({
        ...config,
        ruc: config.ruc ?? "",
        address: config.address ?? "",
        phone: config.phone ?? "",
        email: config.email ?? "",
        ticketHeader: config.ticketHeader ?? "",
        ticketFooter: config.ticketFooter ?? "",
        trackingBaseUrl: config.trackingBaseUrl ?? "",
        logoUrl: config.logoUrl ?? "",
      });
      setTaxRate(Number(config.taxRateDefault || 18));

      setProfile(currentProfile);
      setProfileForm({
        name: currentProfile.name,
        email: currentProfile.email,
      });

      setError(null);
      setSuccessMessage(null);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to load admin settings", err);
      setError("No se pudo cargar la configuración. Verifica tu sesión.");
    } finally {
      setLoading(false);
    }
  }, [setTaxRate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pos_user");
      const parsed = raw ? (JSON.parse(raw) as { role?: string }) : null;
      const role = (parsed?.role || "").toUpperCase();
      const isUserAdmin = role === "ADMIN";
      setIsAdmin(isUserAdmin);

      if (!isUserAdmin) {
        setLoading(false);
        return;
      }
    } catch {
      setLoading(false);
      return;
    }

    fetchInitialData();
  }, [fetchInitialData]);

  const saveBusiness = async () => {
    setSavingAction("business");
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      const payload = {
        companyName: businessForm.companyName.trim(),
        ruc: businessForm.ruc.trim() || null,
        address: businessForm.address.trim() || null,
        phone: businessForm.phone.trim() || null,
        email: businessForm.email.trim() || null,
        taxRateDefault: Number(businessForm.taxRateDefault || 18),
        currency: businessForm.currency.trim().toUpperCase() || "PEN",
        timezone: businessForm.timezone.trim() || "America/Lima",
        ticketHeader: businessForm.ticketHeader.trim() || null,
        ticketFooter: businessForm.ticketFooter.trim() || null,
        trackingBaseUrl: businessForm.trackingBaseUrl.trim() || null,
        trackingExpiryHours: Number(businessForm.trackingExpiryHours || 2),
        logoUrl: businessForm.logoUrl.trim() || null,
      };

      const updated = await apiFetch<BusinessConfig>("/config", {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      });

      setBusinessForm((prev) => ({
        ...prev,
        ...updated,
        ruc: updated.ruc ?? "",
        address: updated.address ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
        ticketHeader: updated.ticketHeader ?? "",
        ticketFooter: updated.ticketFooter ?? "",
        trackingBaseUrl: updated.trackingBaseUrl ?? "",
        logoUrl: updated.logoUrl ?? "",
      }));

      setTaxRate(Number(updated.taxRateDefault || 18));
      setCurrency(updated.currency || "PEN");
      setSuccessMessage("Configuración de negocio guardada correctamente.");
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to save business config", err);
      setError("No se pudo guardar la configuración del negocio.");
    } finally {
      setSavingAction(null);
    }
  };

  const saveProfileName = async () => {
    setSavingAction("profile");
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      const updated = await apiFetch<ProfileResponse>("/auth/profile", {
        method: "PATCH",
        token,
        body: JSON.stringify({ name: profileForm.name.trim() }),
      });

      setProfile(updated);
      setProfileForm((s) => ({ ...s, name: updated.name }));

      const raw = localStorage.getItem("pos_user");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem(
          "pos_user",
          JSON.stringify({
            ...parsed,
            name: updated.name,
          }),
        );
      }

      setSuccessMessage("Nombre actualizado.");
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to update profile", err);
      setError("No se pudo actualizar el nombre.");
    } finally {
      setSavingAction(null);
    }
  };

  const saveProfileEmail = async () => {
    setSavingAction("email");
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      const updated = await apiFetch<ProfileResponse>("/auth/email", {
        method: "PATCH",
        token,
        body: JSON.stringify({ email: profileForm.email.trim() }),
      });

      setProfile(updated);
      setProfileForm((s) => ({ ...s, email: updated.email }));

      const raw = localStorage.getItem("pos_user");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem(
          "pos_user",
          JSON.stringify({
            ...parsed,
            email: updated.email,
          }),
        );
      }

      setSuccessMessage("Correo actualizado.");
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to update email", err);
      setError("No se pudo actualizar el correo. Verifica que no esté en uso.");
    } finally {
      setSavingAction(null);
    }
  };

  const changePassword = async () => {
    setSavingAction("password");
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      const result = await posAlert.fire({
        icon: "warning",
        title: "Confirmar cambio de contraseña",
        text: "Se cerrará tu sesión al finalizar este cambio.",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) {
        setSavingAction(null);
        return;
      }

      await apiFetch<{ success: boolean; forceRelogin: boolean }>(
        "/auth/change-password",
        {
          method: "PATCH",
          token,
          body: JSON.stringify(passwordForm),
        },
      );

      await posAlert.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: "Por seguridad volverás a iniciar sesión.",
        confirmButtonText: "Entendido",
      });

      await resetSessionAndRedirectToLogin();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to change password", err);
      setError("No se pudo cambiar la contraseña. Revisa los datos ingresados.");
    } finally {
      setSavingAction(null);
    }
  };

  const uploadLogo = async (file: File | null) => {
    if (!file) return;

    setUploadingLogo(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      const body = new FormData();
      body.append("file", file);

      const response = await apiFetch<{ logoUrl: string }>("/config/logo", {
        method: "POST",
        token,
        body,
      });

      setBusinessForm((prev) => ({ ...prev, logoUrl: response.logoUrl }));
      setSuccessMessage("Logo actualizado correctamente.");
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to upload logo", err);
      setError("No se pudo subir el logo. Usa PNG, JPG, WebP o SVG (máx. 4MB).");
    } finally {
      setUploadingLogo(false);
    }
  };

  const applyLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setSuccessMessage(`Idioma actualizado a ${localeNames[nextLocale]}.`);
  };

  if (!loading && !isAdmin) {
    return (
      <div className="p-6">
        <div className="max-w-xl rounded-2xl border border-border bg-card p-6 space-y-3">
          <h1 className="text-lg font-bold text-foreground">Acceso restringido</h1>
          <p className="text-sm text-muted-foreground">
            La configuración del negocio solo está disponible para administradores.
          </p>
          <Link
            href="/pos"
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest"
          >
            Volver a Operación
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageSkeleton variant="settings" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        icon={<Settings className="w-4 h-4 text-primary" />}
        title="Admin Settings"
        description="Gestiona negocio, cuenta, seguridad, branding e idioma desde un solo lugar."
      />

      {error && (
        <div className="px-4 py-3 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="px-4 py-3 rounded-2xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium">
          {successMessage}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-3 h-fit">
          <nav className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary/70"
                      : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{section.title}</p>
                      <p
                        className={`text-xs ${
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="rounded-2xl border border-border bg-card p-5">
          {activeSection === "business" && (
            <div className="space-y-5">
              <SectionTitle
                icon={Store}
                title="Datos del negocio"
                description="Nombre, fiscal, contacto y parámetros base."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre"
                  value={businessForm.companyName}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, companyName: value }))
                  }
                />
                <Field
                  label="RUC"
                  value={businessForm.ruc}
                  onChange={(value) => setBusinessForm((s) => ({ ...s, ruc: value }))}
                />
                <label>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Teléfono
                  </span>
                  <PhoneInput
                    value={businessForm.phone}
                    onChange={(value) =>
                      setBusinessForm((s) => ({ ...s, phone: value }))
                    }
                    className="mt-1.5"
                  />
                </label>
                <Field
                  label="Email de negocio"
                  value={businessForm.email}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, email: value }))
                  }
                />
                <Field
                  label="Dirección"
                  value={businessForm.address}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, address: value }))
                  }
                  className="md:col-span-2"
                />
                <Field
                  label="IGV (%)"
                  type="number"
                  value={String(businessForm.taxRateDefault)}
                  onChange={(value) =>
                    setBusinessForm((s) => ({
                      ...s,
                      taxRateDefault: Number(value || 0),
                    }))
                  }
                />
                <label>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Moneda
                  </span>
                  <CurrencySelect
                    value={businessForm.currency}
                    onChange={(value) =>
                      setBusinessForm((s) => ({ ...s, currency: value }))
                    }
                    className="mt-1.5"
                  />
                </label>
                <Field
                  label="Zona horaria"
                  value={businessForm.timezone}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, timezone: value }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveBusiness}
                  disabled={savingAction === "business"}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest shadow hover:opacity-90 transition disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {savingAction === "business" ? "Guardando..." : "Guardar negocio"}
                </button>
              </div>
            </div>
          )}

          {activeSection === "ticket" && (
            <div className="space-y-5">
              <SectionTitle
                icon={Ticket}
                title="Ticket y tracking"
                description="Mensajes impresos y comportamiento del tracking público."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Cabecera ticket"
                  value={businessForm.ticketHeader}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, ticketHeader: value }))
                  }
                />
                <Field
                  label="Pie ticket"
                  value={businessForm.ticketFooter}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, ticketFooter: value }))
                  }
                />
                <Field
                  label="Tracking base URL"
                  value={businessForm.trackingBaseUrl}
                  onChange={(value) =>
                    setBusinessForm((s) => ({ ...s, trackingBaseUrl: value }))
                  }
                />
                <Field
                  label="Expiración tracking (horas)"
                  type="number"
                  value={String(businessForm.trackingExpiryHours)}
                  onChange={(value) =>
                    setBusinessForm((s) => ({
                      ...s,
                      trackingExpiryHours: Number(value || 0),
                    }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveBusiness}
                  disabled={savingAction === "business"}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest shadow hover:opacity-90 transition disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {savingAction === "business" ? "Guardando..." : "Guardar ticket & tracking"}
                </button>
              </div>
            </div>
          )}

          {activeSection === "account" && (
            <div className="space-y-5">
              <SectionTitle
                icon={UserRound}
                title="Cuenta del administrador"
                description="Actualiza tu nombre y correo de acceso."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Nombre"
                  value={profileForm.name}
                  onChange={(value) =>
                    setProfileForm((s) => ({ ...s, name: value }))
                  }
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={saveProfileName}
                    disabled={savingAction === "profile"}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest shadow hover:opacity-90 transition disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {savingAction === "profile" ? "Guardando..." : "Guardar nombre"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Correo de acceso"
                  value={profileForm.email}
                  onChange={(value) =>
                    setProfileForm((s) => ({ ...s, email: value }))
                  }
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={saveProfileEmail}
                    disabled={savingAction === "email"}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest shadow hover:opacity-90 transition disabled:opacity-60"
                  >
                    <Mail className="w-4 h-4" />
                    {savingAction === "email" ? "Guardando..." : "Guardar correo"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Usuario actual: <span className="font-semibold text-foreground">{profile?.role || "ADMIN"}</span>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-5">
              <SectionTitle
                icon={KeyRound}
                title="Seguridad"
                description="Cambio de contraseña con cierre de sesión obligatorio."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Contraseña actual"
                  value={passwordForm.currentPassword}
                  type="password"
                  onChange={(value) =>
                    setPasswordForm((s) => ({ ...s, currentPassword: value }))
                  }
                />
                <Field
                  label="Nueva contraseña"
                  value={passwordForm.newPassword}
                  type="password"
                  onChange={(value) =>
                    setPasswordForm((s) => ({ ...s, newPassword: value }))
                  }
                />
                <Field
                  label="Confirmar nueva contraseña"
                  value={passwordForm.confirmPassword}
                  type="password"
                  onChange={(value) =>
                    setPasswordForm((s) => ({ ...s, confirmPassword: value }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={changePassword}
                  disabled={savingAction === "password"}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest shadow hover:opacity-90 transition disabled:opacity-60"
                >
                  <Shield className="w-4 h-4" />
                  {savingAction === "password"
                    ? "Actualizando..."
                    : "Actualizar contraseña"}
                </button>
              </div>
            </div>
          )}

          {activeSection === "branding" && (
            <div className="space-y-5">
              <SectionTitle
                icon={ImageIcon}
                title="Marca"
                description="Sube el logo oficial o define URL manual como respaldo."
              />

              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-xl border border-border bg-muted/30 p-3 h-45 flex items-center justify-center overflow-hidden">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Logo empresa"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground text-center">
                      Sin logo configurado
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                      Subir logo
                    </label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
                      onChange={(event) => uploadLogo(event.target.files?.[0] ?? null)}
                      className="w-full text-sm text-foreground file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border file:border-border file:bg-background file:text-foreground"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Formatos: PNG, JPG, WEBP, SVG · Máximo 4MB.
                    </p>
                  </div>

                  <Field
                    label="Logo URL (fallback)"
                    value={businessForm.logoUrl}
                    onChange={(value) =>
                      setBusinessForm((s) => ({ ...s, logoUrl: value }))
                    }
                  />

                  <button
                    type="button"
                    onClick={saveBusiness}
                    disabled={savingAction === "business" || uploadingLogo}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest shadow hover:opacity-90 transition disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {uploadingLogo
                      ? "Subiendo logo..."
                      : savingAction === "business"
                        ? "Guardando..."
                        : "Guardar branding"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "language" && (
            <div className="space-y-5">
              <SectionTitle
                icon={Globe}
                title="Idioma y región"
                description="Preferencia global del usuario para POS, Admin y Tracking."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {locales.map((option) => {
                  const isActive = option === locale;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => applyLocale(option)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      }`}
                    >
                      <p className="text-sm font-semibold">{localeNames[option]}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {option}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Esta preferencia se guarda en tu sesión local y aplica globalmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "password";
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
      />
    </label>
  );
}
