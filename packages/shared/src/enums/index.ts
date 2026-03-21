export enum OrderStatus {
  RECEIVED = "RECEIVED",
  PREPARING = "PREPARING",
  IN_OVEN = "IN_OVEN",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export const ACTIVE_ORDER_STATUSES = [
  OrderStatus.RECEIVED,
  OrderStatus.PREPARING,
  OrderStatus.IN_OVEN,
  OrderStatus.READY,
] as const;

export enum OrderType {
  DINE_IN = "DINE_IN",
  TAKEOUT = "TAKEOUT",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  DIGITAL = "DIGITAL",
  MIXED = "MIXED",
}

export enum UserRole {
  ADMIN = "ADMIN",
  CASHIER = "CASHIER",
  KITCHEN = "KITCHEN",
}

export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
}

export enum CashRegisterStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}
