import { create } from "zustand";

export interface CartModifier {
  id: string;
  name: string;
  price: number;
  groupId: string;
}

export interface CartItem {
  id: string; // unique ID for the cart row
  productId: string;
  variantId?: string | null;
  name: string;
  price: number; // base/variant unit price (without modifiers)
  quantity: number;
  imageUrl?: string | null;
  notes?: string;
  variantName?: string;
  modifiers?: CartModifier[];
  modifiersCost?: number; // sum of modifier prices per unit
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string | null) => void;
  clearCart: () => void;
  setTableId: (id: string | null) => void;
  getTotals: () => { subtotal: number; tax: number; total: number };
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  tableId: null,

  addItem: (item) =>
    set((state) => {
      // Two items merge only when same product/variant AND same modifiers
      const newModIds = (item.modifiers || [])
        .map((m) => m.id)
        .sort()
        .join(",");
      const existing = state.items.find(
        (i) =>
          i.productId === item.productId &&
          (i.variantId || null) === (item.variantId || null) &&
          (i.modifiers || [])
            .map((m) => m.id)
            .sort()
            .join(",") === newModIds,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, { ...item, id: crypto.randomUUID() }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    })),

  updateNotes: (id, notes) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, notes: notes || undefined } : i,
      ),
    })),

  clearCart: () => set({ items: [], tableId: null }),

  setTableId: (id) => set({ tableId: id }),

  getTotals: () => {
    const { items } = get();
    const subtotal = items.reduce(
      (sum, item) =>
        sum + (item.price + (item.modifiersCost || 0)) * item.quantity,
      0,
    );
    const taxRate = 0.18; // 18% SUNAT Peru
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  },
}));
