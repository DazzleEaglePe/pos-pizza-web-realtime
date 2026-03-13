import QRCode from "qrcode";
import { API_URL } from "@/lib/config";
import { PrintAuto } from "./print-auto";

type Props = {
  params: { ticketNumber: string } | Promise<{ ticketNumber: string }>;
  searchParams?:
    | { origin?: string; lang?: string }
    | Promise<{ origin?: string; lang?: string }>;
};

function safeOrigin(origin?: string) {
  if (!origin) return null;
  try {
    const u = new URL(origin);
    return u.origin;
  } catch {
    return null;
  }
}

export default async function PrintTicketPage({ params, searchParams }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams || {});

  const ticketNumber = resolvedParams?.ticketNumber;
  if (!ticketNumber) {
    const msg = "Missing ticket.";
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {msg}
      </div>
    );
  }

  const lang = resolvedSearch?.lang === "en" ? "en" : "es";
  const S =
    lang === "en"
      ? {
          missingTicket: "Missing ticket.",
          orderNotFound: "Order not found.",
          ticket: "Ticket",
          status: "Status",
          total: "TOTAL",
          follow: "Track your order at:",
          openTracking: "Open tracking",
          dineIn: "Dine-in",
          takeout: "Takeout",
          table: "Table",
        }
      : {
          missingTicket: "Falta el ticket.",
          orderNotFound: "No se encontró el pedido.",
          ticket: "Ticket",
          status: "Estado",
          total: "TOTAL",
          follow: "Sigue tu pedido en:",
          openTracking: "Abrir tracking",
          dineIn: "Salón",
          takeout: "Para llevar",
          table: "Mesa",
        };

  const origin =
    safeOrigin(resolvedSearch?.origin) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const trackingUrl = `${origin.replace(/\/$/, "")}/tracking/${encodeURIComponent(ticketNumber)}?lang=${encodeURIComponent(lang)}`;

  const res = await fetch(
    `${API_URL}/orders/track/${encodeURIComponent(ticketNumber)}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {S.orderNotFound}
      </div>
    );
  }

  const order = (await res.json()) as {
    ticketNumber: string;
    status: string;
    orderType?: string | null;
    customerName?: string | null;
    table?: { number: number; zone?: string | null } | null;
    createdAt: string;
    total: number;
    items?: Array<{
      productName: string;
      quantity: number;
      subtotal: number;
      variantName?: string | null;
    }>;
  };

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch {
    qrDataUrl = null;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <PrintAuto />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            html, body { background: #fff !important; }
            .ticket { width: 80mm; padding: 0; margin: 0 auto; }
            .no-print { display: none !important; }
          }
          .ticket {
            width: 360px;
            margin: 0 auto;
            padding: 16px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .row { display:flex; justify-content:space-between; gap:12px; }
          .muted { color:#444; font-size:12px; }
          .bold { font-weight: 800; }
          .title { font-size: 18px; font-weight: 900; text-align:center; }
          .hr { border-top: 1px dashed #999; margin: 10px 0; }
          .items { margin-top: 8px; }
          .item { display:flex; justify-content:space-between; gap:12px; font-size:12px; margin: 6px 0; }
          .foot { text-align:center; font-size: 11px; color:#444; margin-top: 10px; }
        `,
        }}
      />

      <div className="ticket">
        <div className="title">POS Pizza</div>
        <div className="muted" style={{ textAlign: "center", marginTop: 4 }}>
          {S.ticket}: <span className="bold">{order.ticketNumber}</span>
        </div>
        <div className="muted" style={{ textAlign: "center", marginTop: 2 }}>
          {new Date(order.createdAt).toLocaleString(
            lang === "en" ? "en-US" : "es-PE",
            {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}
        </div>

        <div className="hr" />

        <div className="row muted">
          <span>{order?.orderType === "DINE_IN" ? S.dineIn : S.takeout}</span>
          <span className="bold">
            {order?.table?.number
              ? `${S.table} ${order.table.number}${order.table.zone ? ` (${order.table.zone})` : ""}`
              : order?.customerName || ""}
          </span>
        </div>

        <div className="row muted">
          <span>{S.status}</span>
          <span className="bold">{order.status}</span>
        </div>

        <div className="items">
          {Array.isArray(order.items) &&
            order.items.map((it, idx: number) => (
              <div className="item" key={idx}>
                <span>
                  {it.quantity}x {it.productName}
                  {it.variantName ? ` (${it.variantName})` : ""}
                </span>
                <span className="bold">
                  S/ {Number(it.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
        </div>

        <div className="hr" />

        <div className="row" style={{ fontSize: 12 }}>
          <span className="bold">{S.total}</span>
          <span className="bold">S/ {Number(order.total).toFixed(2)}</span>
        </div>

        <div className="hr" />

        {qrDataUrl && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={qrDataUrl}
              alt="QR tracking"
              style={{ width: 180, height: 180 }}
            />
          </div>
        )}

        <div className="foot">
          {S.follow}
          <div style={{ wordBreak: "break-all", marginTop: 4 }}>
            {trackingUrl}
          </div>
        </div>

        <div
          className="no-print"
          style={{ marginTop: 16, textAlign: "center" }}
        >
          <a href={trackingUrl} target="_blank" rel="noreferrer">
            {S.openTracking}
          </a>
        </div>
      </div>
    </div>
  );
}
