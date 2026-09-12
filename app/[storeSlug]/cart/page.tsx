'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/modules/store.module.scss';
import { cartManager, CartItem } from '@/lib/cart';
import { getStoreBySlug } from '@/lib/supabase/db';
import { Store } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trash2, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || '';

  const [items, setItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    setItems(cartManager.getItems(storeSlug));
    getStoreBySlug(storeSlug).then(setStore);
  }, [storeSlug]);

  const handleUpdateQty = (itemId: string, newQty: number) => {
    const updated = cartManager.updateQuantity(storeSlug, itemId, newQty);
    setItems([...updated]);
  };

  const handleRemove = (itemId: string) => {
    const updated = cartManager.removeItem(storeSlug, itemId);
    setItems([...updated]);
  };

  const subtotal = cartManager.getSubtotal(items);

  return (
    <div className={styles.storeContainer}>
      <div className={styles.storeContent}>
        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href={`/${storeSlug}`} className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Continuar comprando
          </Link>
        </div>

        <div className={styles.cartView}>
          <h1 className={styles.cartView__title}>Tu Carrito</h1>

          {items.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: '2rem 0' }}>
              <div className="empty-state__icon">
                <ShoppingBag size={44} />
              </div>
              <div className="empty-state__title">Tu carrito está vacío</div>
              <div className="empty-state__description">
                Explora el catálogo de {store?.name || 'la tienda'} y agrega los productos que te gusten.
              </div>
              <Link href={`/${storeSlug}`} className="btn btn--primary btn--sm" style={{ marginTop: '0.75rem' }}>
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <>
              {/* ITEMS LIST (Section 19) */}
              <div className={styles.cartView__itemsList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.cartView__item}>
                    <img
                      src={
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&fit=crop'
                      }
                      alt={item.name}
                    />

                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>

                      {/* Variantes seleccionadas */}
                      {item.variants && Object.keys(item.variants).length > 0 && (
                        <div className={styles.variantText}>
                          {Object.entries(item.variants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                        </div>
                      )}

                      <div className={styles.price}>
                        {formatCurrency(item.price * item.quantity)}
                        {item.quantity > 1 && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>
                            {' '}
                            ({formatCurrency(item.price)} c/u)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.controls}>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className={styles.qtyBtnGroup}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SUBTOTAL & CTAS */}
              <div className={styles.cartView__summary}>
                <div className={styles.row}>
                  <span>Subtotal</span>
                  <span style={{ fontSize: '1.25rem', color: '#0F172A' }}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link
                    href={`/${storeSlug}/checkout`}
                    className="btn btn--primary btn--full btn--lg"
                  >
                    Realizar pedido <ArrowRight size={18} />
                  </Link>

                  <Link href={`/${storeSlug}`} className="btn btn--secondary btn--full">
                    Continuar comprando
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
