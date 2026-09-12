'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from '@/styles/modules/store.module.scss';
import { getStoreBySlug, getProducts } from '@/lib/supabase/db';
import { cartManager, CartItem } from '@/lib/cart';
import { trackEvent } from '@/lib/analytics';
import { Store, Product } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Instagram, MessageCircle, MapPin, Package, Camera } from 'lucide-react';

export default function PublicStoreCatalogPage() {
  const params = useParams();
  const storeSlug = (params?.storeSlug as string) || '';

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      const s = await getStoreBySlug(storeSlug);
      setStore(s);

      if (s) {
        const prods = await getProducts(s.id, true);
        setProducts(prods);

        trackEvent({
          storeId: s.id,
          eventType: 'store_view',
          metadata: { slug: storeSlug, referrer: typeof document !== 'undefined' ? document.referrer : '' },
        });
      }
      setLoading(false);
    }

    if (storeSlug) {
      loadStore();
    }

    // Carrito
    setCartItems(cartManager.getItems(storeSlug));

    // Escuchar cambios en el carrito
    const handleCartUpdate = (e: any) => {
      if (e.detail?.storeSlug === storeSlug) {
        setCartItems(e.detail.items);
      }
    };
    window.addEventListener('qori-cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('qori-cart-updated', handleCartUpdate);
    };
  }, [storeSlug]);

  if (loading) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
          <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
          <div className="empty-state" style={{ maxWidth: '420px', margin: '0 auto' }}>
            <div className="empty-state__icon">
              <Package size={44} />
            </div>
            <div className="empty-state__title">Tienda no encontrada</div>
            <div className="empty-state__description">
              La tienda &quot;{storeSlug}&quot; no existe o ha cambiado de dirección.
            </div>
            <Link href="/" className="btn btn--primary btn--sm" style={{ marginTop: '1rem' }}>
              Ir a Qori
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Categorías únicas
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category || 'General')))];

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => (p.category || 'General') === selectedCategory);

  const cartTotalCount = cartManager.getTotalCount(cartItems);
  const cartSubtotal = cartManager.getSubtotal(cartItems);

  return (
    <div className={styles.storeContainer}>
      <div className={styles.storeContent}>
        {/* STORE HEADER (Section 17) */}
        <header className={styles.header}>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className={styles.header__logo} />
          ) : (
            <div className={styles.header__logoPlaceholder}>
              {store.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <h1 className={styles.header__name}>{store.name}</h1>
          {store.description && <p className={styles.header__desc}>{store.description}</p>}

          <div className={styles.header__meta}>
            {store.city && (
              <span>
                <MapPin size={13} style={{ display: 'inline', verticalAlign: '-1px' }} /> {store.city}
              </span>
            )}
            {store.instagram && (
              <a
                href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={13} /> {store.instagram}
              </a>
            )}
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        </header>

        {/* CATEGORIES BAR */}
        {categories.length > 1 && (
          <div className={styles.categoriesBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.catPill} ${
                  selectedCategory === cat ? styles['catPill--active'] : ''
                }`}
              >
                {cat === 'all' ? 'Todos los productos' : cat}
              </button>
            ))}
          </div>
        )}

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="empty-state__icon">
              <Package size={44} />
            </div>
            <div className="empty-state__title">Esta tienda todavía no tiene productos disponibles</div>
            <div className="empty-state__description">
              Vuelve a consultar pronto o escribe por WhatsApp para consultar el catálogo.
            </div>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {filteredProducts.map((prod) => (
              <div key={prod.id} className={styles.productCard}>
                <Link
                  href={`/${storeSlug}/product/${prod.slug}`}
                  className={styles.productCard__imgWrap}
                >
                  <img
                    src={
                      prod.image_url ||
                      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&fit=crop'
                    }
                    alt={prod.name}
                    loading="lazy"
                  />
                  {prod.images && prod.images.length > 0 && (
                    <span className={styles.productCard__multiBadge}>
                      <Camera size={10} /> {prod.images.length + 1}
                    </span>
                  )}
                </Link>

                <div className={styles.productCard__details}>
                  <div className={styles.productCard__category}>
                    <span>{prod.category}</span>
                    {prod.brand && (
                      <>
                        <span style={{ margin: '0 0.25rem', opacity: 0.6 }}>•</span>
                        <span style={{ fontWeight: 600 }}>{prod.brand}</span>
                      </>
                    )}
                  </div>
                  <Link href={`/${storeSlug}/product/${prod.slug}`}>
                    <h3 className={styles.productCard__name}>{prod.name}</h3>
                  </Link>
                  <div className={styles.productCard__price}>{formatCurrency(prod.price)}</div>

                  <div className={styles.productCard__cta}>
                    <Link
                      href={`/${storeSlug}/product/${prod.slug}`}
                      className="btn btn--secondary btn--full btn--sm"
                    >
                      Ver producto
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STICKY FLOATING CART BAR (Section 19) */}
        {cartTotalCount > 0 && (
          <Link href={`/${storeSlug}/cart`} className={styles.floatingCartBar}>
            <div className={styles.left}>
              <div className={styles.countBadge}>{cartTotalCount}</div>
              <div className={styles.subtotal}>{formatCurrency(cartSubtotal)}</div>
            </div>
            <div className={styles.cta}>
              Ver mi carrito <ArrowRight size={14} />
            </div>
          </Link>
        )}
      </div>

      {/* Powered by Qori badge */}
      <footer style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: '#94A3B8' }}>
        Creado con{' '}
        <Link href="/" style={{ color: '#0F172A', fontWeight: 600 }}>
          Qori<span>.</span>
        </Link>{' '}
        — Catálogo online para WhatsApp
      </footer>
    </div>
  );
}
