import { ApiError } from "@/lib/api";
import { posAlert } from "@/lib/sweetalert";
import type { TranslationKey } from "@/i18n";

/* ─── Error code → i18n key mapping ────────────────────
 * Equivalent to Angular's ResponseMessagesService.
 * Each backend code maps to { titleKey, textKey } i18n keys.
 * ─────────────────────────────────────────────────────── */

interface ErrorEntry {
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

const ERROR_DICTIONARY: Record<string, ErrorEntry> = {
  /* ── Auth ─────────────────────────────────────── */
  INVALID_SESSION:                { titleKey: "apiErrors.sessionExpiredTitle",   textKey: "apiErrors.sessionExpiredText" },
  CURRENT_PASSWORD_INVALID:       { titleKey: "apiErrors.wrongPasswordTitle",   textKey: "apiErrors.wrongPasswordText" },
  PASSWORD_TOO_SHORT:             { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.passwordTooShort" },
  PASSWORD_FIELDS_REQUIRED:       { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.passwordFieldsRequired" },
  PASSWORD_CONFIRMATION_MISMATCH: { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.passwordMismatch" },
  PASSWORD_MUST_CHANGE:           { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.passwordMustChange" },
  AUTH_REQUIRED:                  { titleKey: "apiErrors.authRequiredTitle",     textKey: "apiErrors.authRequiredText" },

  /* ── Users ────────────────────────────────────── */
  USER_NOT_FOUND:                 { titleKey: "apiErrors.notFoundTitle",        textKey: "apiErrors.userNotFound" },
  EMAIL_INVALID:                  { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.emailInvalid" },
  EMAIL_ALREADY_EXISTS:           { titleKey: "apiErrors.conflictTitle",        textKey: "apiErrors.emailExists" },
  EMAIL_REQUIRED:                 { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.emailRequired" },
  NAME_REQUIRED:                  { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.nameRequired" },
  NAME_TOO_SHORT:                 { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.nameTooShort" },
  INVALID_ROLE:                   { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.invalidRole" },

  /* ── Orders ───────────────────────────────────── */
  ORDER_NOT_FOUND:                { titleKey: "apiErrors.notFoundTitle",        textKey: "errors.ORDER_NOT_FOUND" },
  ORDER_ITEMS_REQUIRED:           { titleKey: "apiErrors.validationTitle",      textKey: "errors.ORDER_ITEMS_REQUIRED" },
  ORDER_CREATE_FAILED:            { titleKey: "apiErrors.operationFailedTitle", textKey: "errors.ORDER_CREATE_FAILED" },
  ORDER_CANNOT_CANCEL_DELIVERED:  { titleKey: "apiErrors.operationFailedTitle", textKey: "errors.ORDER_CANNOT_CANCEL_DELIVERED" },

  /* ── Tables ───────────────────────────────────── */
  TABLE_REQUIRED:                 { titleKey: "apiErrors.validationTitle",      textKey: "errors.TABLE_REQUIRED" },
  TABLE_INVALID:                  { titleKey: "apiErrors.validationTitle",      textKey: "errors.TABLE_INVALID" },
  TABLE_NOT_FOUND:                { titleKey: "apiErrors.notFoundTitle",        textKey: "errors.TABLE_NOT_FOUND" },
  TABLE_STATUS_INVALID:           { titleKey: "apiErrors.validationTitle",      textKey: "errors.TABLE_STATUS_INVALID" },
  TABLE_HAS_ACTIVE_ORDERS:        { titleKey: "apiErrors.operationFailedTitle", textKey: "errors.TABLE_HAS_ACTIVE_ORDERS" },
  TABLE_NUMBER_EXISTS:            { titleKey: "apiErrors.conflictTitle",        textKey: "apiErrors.tableNumberExists" },
  INVALID_TABLE_NUMBER:           { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.invalidTableNumber" },
  INVALID_CAPACITY:               { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.invalidCapacity" },

  /* ── Payments ─────────────────────────────────── */
  PAYMENT_METHOD_UNSUPPORTED:     { titleKey: "apiErrors.operationFailedTitle", textKey: "errors.PAYMENT_METHOD_UNSUPPORTED" },
  CASH_RECEIVED_REQUIRED:         { titleKey: "apiErrors.validationTitle",      textKey: "errors.CASH_RECEIVED_REQUIRED" },
  CASH_INSUFFICIENT:              { titleKey: "apiErrors.validationTitle",      textKey: "errors.CASH_INSUFFICIENT" },
  REFERENCE_REQUIRED:             { titleKey: "apiErrors.validationTitle",      textKey: "errors.REFERENCE_REQUIRED" },

  /* ── Cash Register ────────────────────────────── */
  REGISTER_ALREADY_OPEN:          { titleKey: "apiErrors.conflictTitle",        textKey: "errors.REGISTER_ALREADY_OPEN" },
  NO_OPEN_REGISTER:               { titleKey: "apiErrors.operationFailedTitle", textKey: "errors.NO_OPEN_REGISTER" },

  /* ── Inventory ────────────────────────────────── */
  ITEM_NOT_FOUND:                 { titleKey: "apiErrors.notFoundTitle",        textKey: "apiErrors.itemNotFound" },
  RECIPE_NOT_FOUND:               { titleKey: "apiErrors.notFoundTitle",        textKey: "apiErrors.recipeNotFound" },

  /* ── Tracking ─────────────────────────────────── */
  TRACKING_NOT_FOUND:             { titleKey: "apiErrors.notFoundTitle",        textKey: "apiErrors.trackingNotFound" },

  /* ── Config ───────────────────────────────────── */
  LOGO_INVALID_MIME:              { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.logoInvalidFormat" },
  LOGO_FILE_REQUIRED:             { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.logoRequired" },
};

/* ── HTTP status fallback titles ─────────────────── */
const HTTP_STATUS_FALLBACK: Record<number, ErrorEntry> = {
  400: { titleKey: "apiErrors.validationTitle",      textKey: "apiErrors.badRequestText" },
  401: { titleKey: "apiErrors.sessionExpiredTitle",   textKey: "apiErrors.sessionExpiredText" },
  403: { titleKey: "apiErrors.forbiddenTitle",        textKey: "apiErrors.forbiddenText" },
  404: { titleKey: "apiErrors.notFoundTitle",         textKey: "apiErrors.notFoundText" },
  409: { titleKey: "apiErrors.conflictTitle",         textKey: "apiErrors.conflictText" },
  500: { titleKey: "apiErrors.serverErrorTitle",      textKey: "apiErrors.serverErrorText" },
};

/* ─── Types ────────────────────────────────────────── */

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Module-level guard: prevents multiple 401 alerts + redirects when
 *  several concurrent requests fail at the same time. */
let _redirectingTo401 = false;

export interface HandleApiErrorOptions {
  /** Override default SweetAlert icon */
  icon?: "error" | "warning" | "info";
  /** Skip the SweetAlert popup (just return the resolved message) */
  silent?: boolean;
  /** Fallback title if nothing matches */
  fallbackTitle?: string;
  /** Fallback text if nothing matches */
  fallbackText?: string;
}

export interface ResolvedApiError {
  title: string;
  text: string;
  status: number;
  code: string;
}

/* ─── Main handler ─────────────────────────────────
 * Central API error handler — equivalent to Angular's
 * HttpInterceptor + ResponseMessagesService.
 *
 * Handles:
 * - 401 → clears tokens, redirects to /login
 * - 403 → "sin permisos" alert
 * - Known error codes → user-friendly i18n messages
 * - Unknown errors → generic fallback
 * ─────────────────────────────────────────────────── */

export function handleApiError(
  error: unknown,
  t: TranslateFn,
  options?: HandleApiErrorOptions,
): ResolvedApiError {
  const status = error instanceof ApiError ? error.status : 0;
  const code = error instanceof ApiError ? error.code : "UNKNOWN";

  // ─── 401: Session expired → alert, then redirect ───
  if (status === 401) {
    handleSessionExpired(t);
    return {
      title: t("apiErrors.sessionExpiredTitle"),
      text: t("apiErrors.sessionExpiredText"),
      status,
      code,
    };
  }

  // ─── 403: Forbidden ───
  if (status === 403) {
    if (!options?.silent) {
      posAlert.fire({
        icon: "error",
        title: t("apiErrors.forbiddenTitle"),
        text: t("apiErrors.forbiddenText"),
      });
    }
    return {
      title: t("apiErrors.forbiddenTitle"),
      text: t("apiErrors.forbiddenText"),
      status,
      code,
    };
  }

  // ─── Known error code ───
  const entry = ERROR_DICTIONARY[code];
  if (entry) {
    const title = t(entry.titleKey);
    const text = t(entry.textKey);
    if (!options?.silent) {
      posAlert.fire({ icon: options?.icon ?? "error", title, text });
    }
    return { title, text, status, code };
  }

  // ─── HTTP status fallback ───
  const httpFallback = HTTP_STATUS_FALLBACK[status];
  if (httpFallback) {
    const title = t(httpFallback.titleKey);
    const text = t(httpFallback.textKey);
    if (!options?.silent) {
      posAlert.fire({ icon: options?.icon ?? "error", title, text });
    }
    return { title, text, status, code };
  }

  // ─── Generic fallback ───
  const title = options?.fallbackTitle ?? t("apiErrors.genericTitle");
  const text = options?.fallbackText ?? t("apiErrors.genericText");
  if (!options?.silent) {
    posAlert.fire({ icon: "error", title, text });
  }
  return { title, text, status, code };
}

/* ─── Session expired handler ───────────────────────
 * Shows a SweetAlert informing the user their session
 * expired. Clears tokens immediately, redirects to /login
 * only AFTER the user clicks "Ir a login".
 * Deduplicates: only the first concurrent call shows the alert.
 * Accepts an optional `t` for i18n; falls back to Spanish.
 * ───────────────────────────────────────────────────── */
export function handleSessionExpired(t?: TranslateFn) {
  if (_redirectingTo401) return;
  _redirectingTo401 = true;

  clearSession();

  const title = t ? t("apiErrors.sessionExpiredTitle") : "Sesión expirada";
  const text  = t ? t("apiErrors.sessionExpiredText")  : "Tu sesión ha expirado o no es válida. Inicia sesión nuevamente.";
  const btn   = t ? t("apiErrors.goToLogin")           : "Ir a login";

  void posAlert.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: btn,
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then(() => {
    if (typeof window !== "undefined") window.location.href = "/login";
  });
}

/* ─── Helper: clear auth tokens (no redirect) ──── */
function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("pos_access_token");
    window.localStorage.removeItem("pos_user");
    document.cookie =
      "pos_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  } catch {}
}

/** Returns true if the error is a 401 Unauthorized */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Returns true if the error is a 403 Forbidden */
export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
