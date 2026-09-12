import { Product } from './supabase/types';

export interface CartItem {
  id: string; // unique key combining product id and selected variants
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  variants: Record<string, string>;
}

const CART_STORAGE_PREFIX = 'qori_cart_';

export class CartManager {
  private getStorageKey(storeSlug: string): string {
    return `${CART_STORAGE_PREFIX}${storeSlug}`;
  }

  getItems(storeSlug: string): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getStorageKey(storeSlug));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveItems(storeSlug: string, items: CartItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getStorageKey(storeSlug), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('qori-cart-updated', { detail: { storeSlug, items } }));
  }

  addItem(
    storeSlug: string,
    product: Product,
    quantity: number = 1,
    selectedVariants: Record<string, string> = {}
  ): CartItem[] {
    const items = this.getItems(storeSlug);

    // Identificador único por producto y combinación de variantes
    const variantKey = Object.entries(selectedVariants)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    const itemId = `${product.id}_${variantKey}`;

    const existingIndex = items.findIndex((item) => item.id === itemId);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: itemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        quantity,
        variants: selectedVariants,
      });
    }

    this.saveItems(storeSlug, items);
    return items;
  }

  updateQuantity(storeSlug: string, itemId: string, quantity: number): CartItem[] {
    let items = this.getItems(storeSlug);
    if (quantity <= 0) {
      items = items.filter((i) => i.id !== itemId);
    } else {
      const target = items.find((i) => i.id === itemId);
      if (target) {
        target.quantity = quantity;
      }
    }
    this.saveItems(storeSlug, items);
    return items;
  }

  removeItem(storeSlug: string, itemId: string): CartItem[] {
    const items = this.getItems(storeSlug).filter((i) => i.id !== itemId);
    this.saveItems(storeSlug, items);
    return items;
  }

  clearCart(storeSlug: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getStorageKey(storeSlug));
    window.dispatchEvent(new CustomEvent('qori-cart-updated', { detail: { storeSlug, items: [] } }));
  }

  getSubtotal(items: CartItem[]): number {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  getTotalCount(items: CartItem[]): number {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }
}

export const cartManager = new CartManager();
