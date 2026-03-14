export type Table = {
  id: string;
  number: number;
  capacity: number;
  zone?: string | null;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | (string & {});
};

export type CreateOrderResult = {
  ticketNumber: string;
  payment?: { changeAmount?: number } | null;
};

export type ActiveOrder = {
  id: string;
  ticketNumber: string;
  status: string;
  tableId?: string | null;
  table?: { id: string; number: number; zone?: string | null } | null;
  createdAt: string;
};
