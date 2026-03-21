/**
 * Pure functions for order totals and tax calculations.
 * No dependencies on NestJS, DB, or external services.
 */

export interface OrderItemInput {
  productId?: string | null;
  promotionId?: string | null;
  variantId?: string | null;
  name: string;
  quantity: number;
  price: number;
  variantName?: string | null;
  notes?: string | null;
  modifiers?: Array<{ id: string; name: string; price: number }>;
}

export interface OrderItemPayload {
  productId: string | null;
  promotionId: string | null;
  variantId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  modifiersTotal: number;
  subtotal: number;
  notes: string | null;
  variantName: string | null;
  _modifiers: Array<{ id: string; name: string; price: number }>;
}

export interface OrderTotals {
  grossTotal: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export function buildOrderItemsPayload(items: OrderItemInput[]): {
  payload: OrderItemPayload[];
  grossTotal: number;
} {
  let grossTotal = 0;

  const payload = items.map((item) => {
    const mods = item.modifiers || [];
    const modifiersTotal = mods.reduce((s, m) => s + Number(m.price || 0), 0);
    const itemSubtotal = (item.price + modifiersTotal) * item.quantity;
    grossTotal += itemSubtotal;

    return {
      productId: item.promotionId ? null : (item.productId ?? null),
      promotionId: item.promotionId ?? null,
      variantId: item.variantId || null,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      modifiersTotal,
      subtotal: itemSubtotal,
      notes: item.notes || null,
      variantName: item.variantName || null,
      _modifiers: mods,
    };
  });

  return { payload, grossTotal };
}

/**
 * Calculate tax-inclusive totals.
 * @param grossTotal The total including tax
 * @param taxRate    Decimal tax rate (e.g. 0.18 for 18%)
 */
export function calculateTotals(
  grossTotal: number,
  taxRate: number,
): OrderTotals {
  const taxAmount = grossTotal * (taxRate / (1 + taxRate));
  const subtotal = grossTotal - taxAmount;
  return { grossTotal, taxAmount, subtotal, total: grossTotal };
}
