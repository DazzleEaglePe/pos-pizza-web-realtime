/**
 * Receipt / ticket template for ESC/POS thermal printers.
 *
 * Generates the byte buffer for a customer receipt:
 *   - Store header (name, address, RUC)
 *   - Ticket number, date/time, cashier
 *   - Items with qty × price
 *   - Subtotal, discounts, total
 *   - Payment info
 *   - Footer message
 */

import { EscPosBuilder } from "./escpos-builder";

export interface TicketItem {
  name: string;
  variant?: string | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface TicketData {
  storeName: string;
  storeAddress?: string;
  storeRuc?: string;
  storePhone?: string;

  ticketNumber: string;
  date: string; // formatted date string
  time: string; // formatted time string
  cashier?: string;
  orderType?: "DINE_IN" | "TAKEOUT" | string;
  tableNumber?: number;
  customerName?: string;

  items: TicketItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  amountPaid?: number;
  change?: number;

  footerMessage?: string;
}

function money(n: number): string {
  return `S/${n.toFixed(2)}`;
}

export function buildTicket(data: TicketData, cols = 48): Uint8Array {
  const b = new EscPosBuilder().paperWidth(cols).initialize().codePage(16);

  // ── Header ──
  b.alignCenter()
    .doubleSize()
    .bold(true)
    .text(data.storeName)
    .bold(false)
    .normalSize();

  if (data.storeAddress) b.text(data.storeAddress);
  if (data.storeRuc) b.text(`RUC: ${data.storeRuc}`);
  if (data.storePhone) b.text(`Tel: ${data.storePhone}`);

  b.dashedLine("=");

  // ── Ticket info ──
  b.alignLeft()
    .bold(true)
    .text(`TICKET: ${data.ticketNumber}`)
    .bold(false)
    .columns("Fecha:", data.date)
    .columns("Hora:", data.time);

  if (data.cashier) b.columns("Cajero:", data.cashier);

  if (data.orderType === "DINE_IN" && data.tableNumber != null) {
    b.columns("Tipo:", `SALON - Mesa ${data.tableNumber}`);
  } else if (data.customerName) {
    b.columns("Tipo:", `LLEVAR - ${data.customerName}`);
  } else {
    b.columns("Tipo:", data.orderType === "DINE_IN" ? "SALON" : "LLEVAR");
  }

  b.dashedLine();

  // ── Items ──
  b.bold(true).columns("PRODUCTO", "IMPORTE").bold(false).dashedLine();

  for (const item of data.items) {
    const label = item.variant ? `${item.name} (${item.variant})` : item.name;
    b.text(`  ${item.qty} x ${money(item.unitPrice)}`);
    b.columns(label, money(item.subtotal));
  }

  b.dashedLine();

  // ── Totals ──
  b.columns("Subtotal:", money(data.subtotal));
  if (data.discount && data.discount > 0) {
    b.columns("Descuento:", `-${money(data.discount)}`);
  }

  b.bold(true).doubleSize().columns("TOTAL:", money(data.total)).normalSize().bold(false);

  b.dashedLine();

  // ── Payment ──
  if (data.paymentMethod) b.columns("Pago:", data.paymentMethod);
  if (data.amountPaid != null) b.columns("Recibido:", money(data.amountPaid));
  if (data.change != null && data.change > 0)
    b.columns("Cambio:", money(data.change));

  b.feed(1);

  // ── Footer ──
  b.alignCenter().text(data.footerMessage ?? "¡Gracias por su compra!").feed(3).cut();

  return b.build();
}
