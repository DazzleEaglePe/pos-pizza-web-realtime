export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export function getStatusDot(status: string): string {
  const s = String(status || "").toUpperCase();
  if (s === "AVAILABLE") return "bg-primary";
  if (s === "OCCUPIED") return "bg-destructive";
  if (s === "RESERVED") return "bg-amber-500";
  return "bg-muted-foreground";
}

export function getStatusBorder(status: string): string {
  const s = String(status || "").toUpperCase();
  if (s === "AVAILABLE") return "border-primary/40";
  if (s === "OCCUPIED") return "border-destructive/40";
  if (s === "RESERVED") return "border-amber-500/40";
  return "border-muted-foreground/40";
}

export function formatTicketList(tickets: string[]): string {
  const list = tickets.slice(0, 4);
  const rest = tickets.length - list.length;
  return rest > 0 ? `${list.join(", ")} +${rest}` : list.join(", ");
}

export function getTicketsFromDetails(details: unknown): string[] {
  if (!details || typeof details !== "object") return [];
  const d = details as Record<string, unknown>;
  const orders = Array.isArray(d.orders) ? d.orders : [];
  const tickets: string[] = [];
  for (const o of orders) {
    if (!o || typeof o !== "object") continue;
    const ticket = (o as Record<string, unknown>).ticketNumber;
    if (typeof ticket === "string" && ticket.trim()) tickets.push(ticket);
  }
  return tickets;
}
