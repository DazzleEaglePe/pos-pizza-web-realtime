/**
 * Kitchen comanda template for ESC/POS thermal printers.
 *
 * Generates a simplified order slip for the kitchen:
 *   - Ticket number (large)
 *   - Order type + table/customer
 *   - Items with quantities (NO prices)
 *   - Notes / special instructions
 *   - Timestamp
 */

import { EscPosBuilder } from "./escpos-builder";

export interface ComandaItem {
  name: string;
  variant?: string | null;
  qty: number;
  notes?: string;
}

export interface ComandaData {
  ticketNumber: string;
  orderType: "DINE_IN" | "TAKEOUT" | string;
  tableNumber?: number;
  customerName?: string;
  time: string;

  items: ComandaItem[];
  generalNotes?: string;
}

export function buildComanda(data: ComandaData, cols = 48): Uint8Array {
  const b = new EscPosBuilder().paperWidth(cols).initialize().codePage(16);

  // ── Header ──
  b.alignCenter()
    .bold(true)
    .text("*** COMANDA ***")
    .feed(1)
    .doubleSize()
    .text(data.ticketNumber)
    .normalSize()
    .bold(false);

  b.dashedLine("=");

  // ── Order info ──
  b.alignLeft();

  if (data.orderType === "DINE_IN" && data.tableNumber != null) {
    b.bold(true).doubleSize().text(`MESA ${data.tableNumber}`).normalSize().bold(false);
  } else if (data.customerName) {
    b.bold(true).text(`LLEVAR: ${data.customerName}`).bold(false);
  } else {
    b.bold(true).text("PARA LLEVAR").bold(false);
  }

  b.columns("Hora:", data.time);
  b.dashedLine();

  // ── Items ──
  for (const item of data.items) {
    const label = item.variant ? `${item.name} (${item.variant})` : item.name;
    b.bold(true).text(`${item.qty}x ${label}`).bold(false);
    if (item.notes) {
      b.text(`   >> ${item.notes}`);
    }
  }

  b.dashedLine();

  // ── General notes ──
  if (data.generalNotes) {
    b.bold(true).text("NOTAS:").bold(false).text(data.generalNotes);
    b.dashedLine();
  }

  b.feed(3).cut();

  return b.build();
}
