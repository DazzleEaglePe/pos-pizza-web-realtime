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

/** Currency symbol map */
function currencySymbol(code?: string) {
  switch (code) {
    case "USD": return "$";
    case "EUR": return "€";
    default: return "S/";
  }
}

export default async function PrintTicketPage({ params, searchParams }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams || {});

  const ticketNumber = resolvedParams?.ticketNumber;
  if (!ticketNumber) {
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        Falta el ticket.
      </div>
    );
  }

  const lang = resolvedSearch?.lang === "en" ? "en" : "es";
  const S =
    lang === "en"
      ? {
          orderNotFound: "Order not found.",
          ticket: "TICKET DE VENTA",
          dineIn: "Dine-in",
          takeout: "Takeout",
          table: "Table",
          customer: "Customer",
          date: "Date",
          time: "Time",
          qty: "CANT",
          description: "DESCRIPCIÓN",
          pUnit: "P.UNIT",
          amount: "IMPORTE",
          subtotal: "Op. Gravada",
          igv: "I.G.V.",
          total: "TOTAL",
          follow: "Track your order:",
          openTracking: "Open tracking",
          currency: "Currency",
        }
      : {
          orderNotFound: "No se encontró el pedido.",
          ticket: "TICKET DE VENTA",
          dineIn: "Salón",
          takeout: "Para llevar",
          table: "Mesa",
          customer: "Cliente",
          date: "Fecha",
          time: "Hora",
          qty: "CANT",
          description: "DESCRIPCIÓN",
          pUnit: "P.UNIT",
          amount: "IMPORTE",
          subtotal: "Op. Gravada",
          igv: "I.G.V.",
          total: "TOTAL",
          follow: "Sigue tu pedido:",
          openTracking: "Abrir tracking",
          currency: "Moneda",
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
      headers: { Accept: "application/json" },
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
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    createdAt: string;
    business?: {
      companyName: string;
      ruc?: string | null;
      address?: string | null;
      phone?: string | null;
      logoUrl?: string | null;
      currency?: string | null;
      ticketHeader?: string | null;
      ticketFooter?: string | null;
    };
    items?: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      variantName?: string | null;
    }>;
  };

  const biz = order.business ?? { companyName: "POS Pizza" };
  const sym = currencySymbol(biz.currency ?? "PEN");
  const taxPct = order.taxRate ?? 18;

  // Build the logo absolute URL
  let logoSrc: string | null = null;
  if (biz.logoUrl) {
    logoSrc = biz.logoUrl.startsWith("http")
      ? biz.logoUrl
      : `${API_URL.replace(/\/$/, "")}${biz.logoUrl}`;
  }

  const createdDate = new Date(order.createdAt);
  const dateStr = createdDate.toLocaleDateString(
    lang === "en" ? "en-US" : "es-PE",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );
  const timeStr = createdDate.toLocaleTimeString(
    lang === "en" ? "en-US" : "es-PE",
    { hour: "2-digit", minute: "2-digit" },
  );

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
            html, body { background: #fff !important; -webkit-print-color-adjust: exact; }
            .ticket { width: 80mm; padding: 0; margin: 0 auto; }
            .no-print { display: none !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .ticket {
            width: 360px;
            margin: 0 auto;
            padding: 12px 16px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12px;
            line-height: 1.4;
          }
          /* ─── Header ─── */
          .tk-header { text-align: center; }
          .tk-logo { max-width: 120px; max-height: 60px; margin: 0 auto 6px; display: block; }
          .tk-company { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
          .tk-ruc { font-size: 11px; font-weight: 700; margin-top: 2px; }
          .tk-addr { font-size: 10px; color: #333; margin-top: 2px; }
          .tk-phone { font-size: 10px; color: #333; }
          .tk-doctype {
            font-size: 13px; font-weight: 900; text-align: center;
            border: 1.5px solid #000; padding: 4px 0; margin: 8px 0;
          }
          .tk-ticketnum { text-align: center; font-size: 12px; font-weight: 700; }
          .tk-custom-header { text-align: center; font-size: 10px; color: #333; margin-top: 4px; white-space: pre-line; }
          /* ─── Dividers ─── */
          .hr { border-top: 1px dashed #999; margin: 8px 0; }
          .hr-double { border-top: 2px solid #000; margin: 8px 0; }
          /* ─── Meta rows ─── */
          .tk-meta { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
          .tk-meta-label { color: #555; }
          .tk-meta-value { font-weight: 700; }
          /* ─── Items table ─── */
          .tk-items { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .tk-items th {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            border-bottom: 1px solid #000; padding: 3px 2px; text-align: left;
          }
          .tk-items th:first-child { width: 32px; text-align: center; }
          .tk-items th:nth-child(3),
          .tk-items th:nth-child(4) { text-align: right; width: 60px; }
          .tk-items td { font-size: 11px; padding: 3px 2px; vertical-align: top; }
          .tk-items td:first-child { text-align: center; }
          .tk-items td:nth-child(3),
          .tk-items td:nth-child(4) { text-align: right; font-variant-numeric: tabular-nums; }
          .tk-items tr:last-child td { padding-bottom: 6px; }
          .tk-variant { font-size: 10px; color: #555; }
          /* ─── Totals ─── */
          .tk-totals { margin-top: 2px; }
          .tk-total-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
          .tk-total-row.grand { font-size: 14px; font-weight: 900; margin: 4px 0; }
          .tk-total-label { }
          .tk-total-value { font-variant-numeric: tabular-nums; text-align: right; min-width: 70px; }
          /* ─── Footer ─── */
          .tk-qr { display: flex; justify-content: center; margin: 8px 0 4px; }
          .tk-qr img { width: 160px; height: 160px; }
          .tk-tracking { text-align: center; font-size: 10px; color: #555; word-break: break-all; }
          .tk-custom-footer { text-align: center; font-size: 10px; color: #333; margin-top: 6px; white-space: pre-line; }
          .tk-legal { text-align: center; font-size: 9px; color: #777; margin-top: 6px; }
        `,
        }}
      />

      <div className="ticket">
        {/* ═══════ HEADER: Logo + Business Info ═══════ */}
        <div className="tk-header">
          {logoSrc && (
            <img className="tk-logo" src={logoSrc} alt="Logo" />
          )}
          <div className="tk-company">{biz.companyName}</div>
          {biz.ruc && <div className="tk-ruc">RUC: {biz.ruc}</div>}
          {biz.address && <div className="tk-addr">{biz.address}</div>}
          {biz.phone && <div className="tk-phone">Tel: {biz.phone}</div>}
        </div>

        {/* ═══════ Document type ═══════ */}
        <div className="tk-doctype">{S.ticket}</div>
        <div className="tk-ticketnum">{order.ticketNumber}</div>

        {biz.ticketHeader && (
          <div className="tk-custom-header">{biz.ticketHeader}</div>
        )}

        <div className="hr" />

        {/* ═══════ Meta: Date, Time, Type, Table/Customer ═══════ */}
        <div className="tk-meta">
          <span className="tk-meta-label">{S.date}:</span>
          <span className="tk-meta-value">{dateStr}</span>
        </div>
        <div className="tk-meta">
          <span className="tk-meta-label">{S.time}:</span>
          <span className="tk-meta-value">{timeStr}</span>
        </div>
        <div className="tk-meta">
          <span className="tk-meta-label">
            {order?.orderType === "DINE_IN" ? S.dineIn : S.takeout}
          </span>
          <span className="tk-meta-value">
            {order?.table?.number
              ? `${S.table} ${order.table.number}${order.table.zone ? ` (${order.table.zone})` : ""}`
              : order?.customerName || ""}
          </span>
        </div>
        {order?.customerName && order?.table?.number && (
          <div className="tk-meta">
            <span className="tk-meta-label">{S.customer}:</span>
            <span className="tk-meta-value">{order.customerName}</span>
          </div>
        )}
        <div className="tk-meta">
          <span className="tk-meta-label">{S.currency}:</span>
          <span className="tk-meta-value">{biz.currency ?? "PEN"}</span>
        </div>

        <div className="hr-double" />

        {/* ═══════ Items Table ═══════ */}
        <table className="tk-items">
          <thead>
            <tr>
              <th>{S.qty}</th>
              <th>{S.description}</th>
              <th>{S.pUnit}</th>
              <th>{S.amount}</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(order.items) &&
              order.items.map((it, idx: number) => (
                <tr key={idx}>
                  <td>{it.quantity}</td>
                  <td>
                    {it.productName}
                    {it.variantName && (
                      <span className="tk-variant"> ({it.variantName})</span>
                    )}
                  </td>
                  <td>{Number(it.unitPrice).toFixed(2)}</td>
                  <td>{Number(it.subtotal).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="hr-double" />

        {/* ═══════ Totals ═══════ */}
        <div className="tk-totals">
          <div className="tk-total-row">
            <span className="tk-total-label">{S.subtotal}</span>
            <span className="tk-total-value">
              {sym} {Number(order.subtotal).toFixed(2)}
            </span>
          </div>
          <div className="tk-total-row">
            <span className="tk-total-label">
              {S.igv} ({taxPct}%)
            </span>
            <span className="tk-total-value">
              {sym} {Number(order.taxAmount).toFixed(2)}
            </span>
          </div>
          <div className="hr" />
          <div className="tk-total-row grand">
            <span className="tk-total-label">{S.total}</span>
            <span className="tk-total-value">
              {sym} {Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="hr" />

        {/* ═══════ QR + Tracking ═══════ */}
        {qrDataUrl && (
          <div className="tk-qr">
            <img src={qrDataUrl} alt="QR tracking" />
          </div>
        )}

        <div className="tk-tracking">
          {S.follow}
          <br />
          {trackingUrl}
        </div>

        {/* ═══════ Custom footer ═══════ */}
        {biz.ticketFooter && (
          <div className="tk-custom-footer">{biz.ticketFooter}</div>
        )}

        <div className="tk-legal">
          Representación impresa del ticket de venta
        </div>

        {/* ═══════ No-print link ═══════ */}
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
