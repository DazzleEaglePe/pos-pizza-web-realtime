"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────── */

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-600 border-green-500/20",
  UPDATE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
};

const ACTION_ICON: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

/* ─── Component ─────────────────────────────────── */

export default function AuditPage() {
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Filters */
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await apiFetch<AuditResponse>(
        `/audit-logs?${params.toString()}`,
        { token },
      );
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, fromDate, toDate]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && logs.length === 0) return <PageSkeleton />;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t("audit.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("audit.subtitle")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-border bg-muted text-sm text-foreground"
        >
          <option value="">{t("audit.allActions")}</option>
          <option value="CREATE">{t("audit.create")}</option>
          <option value="UPDATE">{t("audit.update")}</option>
          <option value="DELETE">{t("audit.delete")}</option>
        </select>
        <input
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          placeholder={t("audit.allEntities")}
          className="h-9 px-3 w-40 rounded-lg border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-border bg-muted text-sm text-foreground"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-border bg-muted text-sm text-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  {t("audit.date")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  {t("audit.user")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  {t("audit.action")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  {t("audit.entity")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  {t("audit.details")}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {t("audit.empty")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const ActionIcon = ACTION_ICON[log.action] ?? ScrollText;
                  const badgeCls =
                    ACTION_BADGE[log.action] ??
                    "bg-gray-500/10 text-gray-600 border-gray-500/20";
                  const isExpanded = expandedId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-[13px]">
                            {log.userName ?? "Sistema"}
                          </span>
                          {log.userEmail && (
                            <span className="text-xs text-muted-foreground">
                              {log.userEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeCls}`}
                        >
                          <ActionIcon className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground font-medium text-[13px]">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="block text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.details ? (
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : log.id)
                            }
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                          >
                            {t("audit.viewDetails")}
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                        {isExpanded && log.details && (
                          <pre className="mt-2 p-3 bg-muted rounded-lg text-xs text-foreground overflow-x-auto max-w-[350px] max-h-[200px] overflow-y-auto border border-border">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {t("audit.showing")} {(page - 1) * limit + 1}–
              {Math.min(page * limit, total)} {t("audit.of")} {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-foreground min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
