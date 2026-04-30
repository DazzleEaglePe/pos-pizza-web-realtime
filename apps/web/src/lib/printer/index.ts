/** Barrel export for the printer library */

export { EscPosBuilder } from "./escpos-builder";
export { buildTicket, type TicketData, type TicketItem } from "./ticket-template";
export { buildComanda, type ComandaData, type ComandaItem } from "./comanda-template";
export { type PrinterAdapter, WebUsbAdapter, NetworkAdapter } from "./adapters";
export { printManager, type PrinterType } from "./print-manager";
