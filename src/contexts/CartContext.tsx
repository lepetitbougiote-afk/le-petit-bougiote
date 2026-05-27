import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, DiningMode, FulfillmentType, Product } from '../types';

const STORAGE_KEY = 'bougiote-cart';
const DEFAULT_FULFILLMENT_TYPE: FulfillmentType = 'click_collect';

interface CartStoragePayload {
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  diningMode: DiningMode;
}

interface CartContextValue {
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  diningMode: DiningMode;
  setFulfillmentType: (fulfillmentType: FulfillmentType) => void;
  setDiningMode: (diningMode: DiningMode) => void;
  addItem: (product: Product, note?: string) => void;
  addCustomItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemNote: (itemId: string, note: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function createCartItemId() {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function matchesLine(current: CartItem, incoming: Omit<CartItem, 'id'>) {
  return (
    current.productId === incoming.productId &&
    current.name === incoming.name &&
    current.note === incoming.note &&
    JSON.stringify(current.selectedOptions ?? []) === JSON.stringify(incoming.selectedOptions ?? [])
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(DEFAULT_FULFILLMENT_TYPE);
  const [diningMode, setDiningMode] = useState<DiningMode>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CartItem[] | CartStoragePayload;
        if (Array.isArray(parsed)) {
          setItems(parsed.map((item) => ({ ...item, id: item.id ?? createCartItemId() })));
          setFulfillmentType(DEFAULT_FULFILLMENT_TYPE);
          setDiningMode(null);
          return;
        }
        setItems((parsed.items ?? []).map((item) => ({ ...item, id: item.id ?? createCartItemId() })));
        setFulfillmentType(parsed.fulfillmentType ?? DEFAULT_FULFILLMENT_TYPE);
        setDiningMode(parsed.diningMode ?? null);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items,
        fulfillmentType,
        diningMode,
      } satisfies CartStoragePayload),
    );
  }, [items, fulfillmentType, diningMode]);

  const addCustomItem = (incoming: Omit<CartItem, 'id'>) => {
    setItems((current) => {
      const existing = current.find((item) => matchesLine(item, incoming));
      if (existing) {
        return current.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + incoming.quantity } : item,
        );
      }
      return [
        ...current,
        {
          ...incoming,
          id: createCartItemId(),
        },
      ];
    });
  };

  const addItem = (product: Product, note = '') => {
    addCustomItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      priceLabel: product.priceLabel,
      quantity: 1,
      note,
      image: product.image,
      imageAlt: product.imageAlt,
      imageFit: product.imageFit,
      configuratorKey: product.configuratorKey,
    });
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const updateItemNote = (itemId: string, note: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, note } : item)),
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        fulfillmentType,
        diningMode,
        setFulfillmentType,
        setDiningMode,
        addItem,
        addCustomItem,
        removeItem,
        updateQuantity,
        updateItemNote,
        clearCart,
        subtotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
