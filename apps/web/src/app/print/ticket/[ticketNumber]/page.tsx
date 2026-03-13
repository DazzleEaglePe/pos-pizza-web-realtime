import QRCode from "qrcode";
import { API_URL } from "@/lib/config";
import { PrintAuto } from "./print-auto";

type Props = {
  params: { ticketNumber: string } | Promise<{ ticketNumber: string }>;
  searchParams?: { origin?: string } | Promise<{ origin?: string }>;
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
  const resolvedParams = await Promise.resolve(params as any);
  const resolvedSearch = await Promise.resolve((searchParams as any) || {});

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

  const origin =
    safeOrigin(resolvedSearch?.origin) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const trackingUrl = `${origin.replace(/\/$/, "")}/tracking/${encodeURIComponent(ticketNumber)}`;

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
        No se encontro el pedido.
      </div>
    );
  }

  const order: any = await res.json();

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
        // eslint-disable-next-line react/no-danger
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
          Ticket: <span className="bold">{order.ticketNumber}</span>
        </div>
        <div className="muted" style={{ textAlign: "center", marginTop: 2 }}>
          {new Date(order.createdAt).toLocaleString("es-PE", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div className="hr" />

        <div className="row muted">
          <span>Estado</span>
          <span className="bold">{order.status}</span>
        </div>

        <div className="items">
          {Array.isArray(order.items) &&
            order.items.map((it: any, idx: number) => (
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
          <span className="bold">TOTAL</span>
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
          Sigue tu pedido en:
          <div style={{ wordBreak: "break-all", marginTop: 4 }}>
            {trackingUrl}
          </div>
        </div>

        <div
          className="no-print"
          style={{ marginTop: 16, textAlign: "center" }}
        >
          <a href={trackingUrl} target="_blank" rel="noreferrer">
            Abrir tracking
          </a>
        </div>
      </div>
    </div>
  );
}
