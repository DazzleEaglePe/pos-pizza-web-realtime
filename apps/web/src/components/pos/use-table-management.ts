import { useEffect, useMemo, useState } from "react";
import { posAlert } from "@/lib/sweetalert";
import { apiFetch, ApiError } from "@/lib/api";
import { useTranslation } from "@/i18n";
import { useCart } from "@/hooks/useCart";
import Swal from "sweetalert2";
import type { Table, ActiveOrder } from "./types";
import { formatTicketList, getTicketsFromDetails } from "./table-utils";
import { handleApiError, isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";

const errorKeyByCode = {
  ORDER_NOT_FOUND: "errors.ORDER_NOT_FOUND",
  ORDER_ITEMS_REQUIRED: "errors.ORDER_ITEMS_REQUIRED",
  TABLE_REQUIRED: "errors.TABLE_REQUIRED",
  TABLE_INVALID: "errors.TABLE_INVALID",
  TABLE_NOT_FOUND: "errors.TABLE_NOT_FOUND",
  TABLE_STATUS_INVALID: "errors.TABLE_STATUS_INVALID",
  TABLE_HAS_ACTIVE_ORDERS: "errors.TABLE_HAS_ACTIVE_ORDERS",
  ORDER_CREATE_FAILED: "errors.ORDER_CREATE_FAILED",
  ORDER_CANNOT_CANCEL_DELIVERED: "errors.ORDER_CANNOT_CANCEL_DELIVERED",
  PAYMENT_METHOD_UNSUPPORTED: "errors.PAYMENT_METHOD_UNSUPPORTED",
  CASH_RECEIVED_REQUIRED: "errors.CASH_RECEIVED_REQUIRED",
  CASH_INSUFFICIENT: "errors.CASH_INSUFFICIENT",
  REFERENCE_REQUIRED: "errors.REFERENCE_REQUIRED",
} as const;

export { errorKeyByCode };

export function useTableManagement(orderType: "DINE_IN" | "TAKEOUT", isAdmin: boolean) {
  const tableId = useCart((s) => s.tableId);
  const setTableId = useCart((s) => s.setTableId);
  const { t } = useTranslation();

  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [tableTouched, setTableTouched] = useState(false);

  const [zoneFilter, setZoneFilter] = useState<string>("*");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "OCCUPIED" | "RESERVED">("ALL");
  const [dialogTableId, setDialogTableId] = useState<string | null>(null);

  const selectedTable = useMemo(() => {
    if (!tableId) return null;
    return tables.find((tb) => tb.id === tableId) || null;
  }, [tableId, tables]);

  const zoneOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tb of tables) set.add((tb.zone || "").trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [tables]);

  const filteredTables = useMemo(
    () =>
      [...tables]
        .filter((tb) => {
          const z = (tb.zone || "").trim();
          if (zoneFilter !== "*" && z !== zoneFilter) return false;
          const s = String(tb.status || "").toUpperCase();
          if (statusFilter === "ALL") return true;
          return s === statusFilter;
        })
        .sort((a, b) => a.number - b.number),
    [tables, zoneFilter, statusFilter],
  );

  const activeOrdersByTableId = useMemo(() => {
    const map = new Map<string, ActiveOrder[]>();
    for (const o of activeOrders) {
      const tid = o.tableId || o.table?.id;
      if (!tid) continue;
      const arr = map.get(tid) || [];
      arr.push(o);
      map.set(tid, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [activeOrders]);

  const dialogSelectedTable = useMemo(() => {
    if (!dialogTableId) return null;
    return tables.find((tb) => tb.id === dialogTableId) || null;
  }, [dialogTableId, tables]);

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const data = await apiFetch<Table[]>("/tables");
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      setTables([]);
    } finally {
      setTablesLoading(false);
    }
  };

  const loadActiveOrders = async () => {
    setActiveOrdersLoading(true);
    try {
      const data = await apiFetch<ActiveOrder[]>("/orders/active");
      setActiveOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      setActiveOrders([]);
    } finally {
      setActiveOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (orderType !== "DINE_IN") return;
    if (!tablesLoading && tables.length === 0) void loadTables();
    if (!activeOrdersLoading && activeOrders.length === 0) void loadActiveOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType]);

  const applyTableUpdate = (updated: Table) => {
    setTables((prev) => {
      const idx = prev.findIndex((tb) => tb.id === updated.id);
      if (idx === -1) return [...prev, updated].sort((a, b) => a.number - b.number);
      const next = [...prev];
      next[idx] = { ...next[idx], ...updated };
      return next;
    });
  };

  const updateTableStatus = async (
    id: string,
    status: "AVAILABLE" | "OCCUPIED" | "RESERVED",
    opts?: { force?: boolean; reason?: string },
  ) => {
    const updated = await apiFetch<Table>(`/tables/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...(opts || {}) }),
    });
    applyTableUpdate(updated);
    return updated;
  };

  const handleSelectTableFromDialog = async (tb: Table) => {
    const status = String(tb.status || "").toUpperCase();
    if (status === "RESERVED") return;

    if (status === "OCCUPIED") {
      const confirm = await posAlert.fire({
        icon: "warning",
        title: t("tables.occupiedSelectTitle"),
        text: t("tables.occupiedSelectText"),
        showCancelButton: true,
        confirmButtonText: t("tables.occupiedSelectConfirm"),
        cancelButtonText: t("common.cancel"),
      });
      if (!confirm.isConfirmed) return;
    }

    setTableId(tb.id);
    setTableTouched(false);
    setIsTableDialogOpen(false);
  };

  const handleReleaseTable = async (tb: Table) => {
    const confirm = await posAlert.fire({
      icon: "warning",
      title: t("tables.releaseConfirmTitle", { number: tb.number }),
      text: t("tables.releaseConfirmText"),
      showCancelButton: true,
      confirmButtonText: t("tables.releaseAction"),
      cancelButtonText: t("common.cancel"),
    });
    if (!confirm.isConfirmed) return;

    try {
      const updated = await updateTableStatus(tb.id, "AVAILABLE");

      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 1700,
        showConfirmButton: false,
        icon: "success",
        title: t("tables.releaseSuccess"),
      });

      if (dialogTableId === tb.id) setDialogTableId(updated.id);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === "TABLE_HAS_ACTIVE_ORDERS") {
        const tickets = getTicketsFromDetails(error.details);
        const ticketsText = formatTicketList(tickets);

        const detailsObj =
          error.details && typeof error.details === "object"
            ? (error.details as Record<string, unknown>)
            : null;
        const canForceFromApi = detailsObj?.canForce === true;
        const canForce = isAdmin || canForceFromApi;

        if (!canForce) {
          await posAlert.fire({
            icon: "error",
            title: t("tables.releaseBlockedTitle"),
            text: ticketsText
              ? t("tables.releaseBlockedText", { tickets: ticketsText })
              : t("errors.TABLE_HAS_ACTIVE_ORDERS"),
            confirmButtonText: t("common.close"),
          });
          return;
        }

        const force = await posAlert.fire({
          icon: "warning",
          title: t("tables.forceReleaseTitle"),
          text: t("tables.forceReleaseText"),
          footer: ticketsText
            ? t("tables.releaseBlockedText", { tickets: ticketsText })
            : undefined,
          input: "text",
          inputLabel: t("tables.forceReasonLabel"),
          inputPlaceholder: t("tables.forceReasonPlaceholder"),
          inputAttributes: { autocapitalize: "off", autocomplete: "off" },
          showCancelButton: true,
          confirmButtonText: t("tables.forceAction"),
          cancelButtonText: t("common.cancel"),
          preConfirm: (value) => {
            const reason = String(value || "").trim();
            if (!reason) {
              Swal.showValidationMessage(t("tables.forceReasonRequired"));
              return false;
            }
            return reason;
          },
        });

        if (!force.isConfirmed) return;

        const reason = String(force.value || "").trim();
        const updated = await updateTableStatus(tb.id, "AVAILABLE", { force: true, reason });

        posAlert.fire({
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
          icon: "success",
          title: t("tables.releaseSuccess"),
        });

        if (dialogTableId === tb.id) setDialogTableId(updated.id);
        return;
      }

      const code = error instanceof ApiError ? error.code : null;
      const message =
        code && Object.prototype.hasOwnProperty.call(errorKeyByCode, code)
          ? t(errorKeyByCode[code as keyof typeof errorKeyByCode])
          : undefined;

      if (message) {
        await posAlert.fire({
          icon: "error",
          title: t("tables.releaseAction"),
          text: message,
          confirmButtonText: t("common.close"),
        });
      } else {
        handleApiError(error, t);
      }
    }
  };

  const openTableDialog = () => {
    setZoneFilter("*");
    setStatusFilter("ALL");
    setDialogTableId(tableId);
    setIsTableDialogOpen(true);
    void Promise.all([loadTables(), loadActiveOrders()]);
  };

  const refreshTables = () => void Promise.all([loadTables(), loadActiveOrders()]);

  return {
    tableId,
    setTableId,
    selectedTable,
    tableTouched,
    setTableTouched,
    isTableDialogOpen,
    setIsTableDialogOpen,
    tablesLoading,
    activeOrdersLoading,
    tables,
    filteredTables,
    zoneOptions,
    zoneFilter,
    setZoneFilter,
    statusFilter,
    setStatusFilter,
    dialogTableId,
    setDialogTableId,
    dialogSelectedTable,
    activeOrdersByTableId,
    loadTables,
    loadActiveOrders,
    openTableDialog,
    refreshTables,
    handleSelectTableFromDialog,
    handleReleaseTable,
  };
}
