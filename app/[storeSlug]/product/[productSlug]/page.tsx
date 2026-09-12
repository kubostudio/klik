'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/modules/store.module.scss';
import { getStoreBySlug, getProductBySlug, getAllProductImages } from '@/lib/supabase/db';
import { cartManager } from '@/lib/cart';
import { trackEvent } from '@/lib/analytics';
import { Store, Product } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ShoppingCart, Check, Zap, Package } from 'lucide-react';
import ProductCarousel from '@/components/store/ProductCarousel';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || '';
  const productSlug = (params?.productSlug as string) || '';

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const s = await getStoreBySlug(storeSlug);
      setStore(s);

      if (s) {
        const prod = await getProductBySlug(s.id, productSlug);
        setProduct(prod);

        if (prod) {
          if (prod.variants && prod.variants.length > 0) {
            const initialVariants: Record<string, string> = {};
            prod.variants.forEach((v) => {
              if (!initialVariants[v.name]) {
                initialVariants[v.name] = v.value;
              }
            });
            setSelectedVariants(initialVariants);
          }

          trackEvent({
            storeId: s.id,
            eventType: 'product_view',
            productId: prod.id,
            metadata: { name: prod.name, price: prod.price },
          });
        }
      }
      setLoading(false);
    }

    if (storeSlug && productSlug) {
      loadProduct();
    }
  }, [storeSlug, productSlug]);

  if (loading) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
          <p style={{ color: '#a3a3a3', fontSize: '0.9375rem' }}>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
          <div className="empty-state" style={{ maxWidth: '420px', margin: '0 auto' }}>
            <div className="empty-state__icon">
              <Package size={44} />
            </div>
            <div className="empty-state__title">Producto no disponible</div>
            <div className="empty-state__description">
              El producto no existe o ya no está disponible en el catálogo.
            </div>
            <Link href={`/${storeSlug}`} className="btn btn--primary btn--sm" style={{ marginTop: '1rem' }}>
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar variantes por nombre ('Talla', 'Color')
  const variantGroups: Record<string, string[]> = {};
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v) => {
      if (!variantGroups[v.name]) {
        variantGroups[v.name] = [];
      }
      if (!variantGroups[v.name].includes(v.value)) {
        variantGroups[v.name].push(v.value);
      }
    });
  }

  const handleSelectVariant = (groupName: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [groupName]: value }));
  };

  const handleAddToCart = () => {
    cartManager.addItem(storeSlug, product, quantity, selectedVariants);
    trackEvent({
      storeId: store.id,
      eventType: 'cart_add',
      productId: product.id,
      metadata: { quantity, variants: selectedVariants },
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNow = () => {
    cartManager.addItem(storeSlug, product, quantity, selectedVariants);
    trackEvent({
      storeId: store.id,
      eventType: 'cart_add',
      productId: product.id,
      metadata: { buyNow: true, quantity, variants: selectedVariants },
    });
    router.push(`/${storeSlug}/checkout`);
  };

  return (
    <div className={styles.storeContainer}>
      <div className={styles.storeContent}>
        {/* TOP BAR / BACK TO STORE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href={`/${storeSlug}`} className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Volver a {store.name}
          </Link>

          <Link href={`/${storeSlug}/cart`} className="btn btn--secondary btn--sm">
            <ShoppingCart size={14} /> Carrito
          </Link>
        </div>

        {/* PRODUCT DETAIL CARD (Section 18) */}
        <div className={styles.productDetail}>
          <div className={styles.productDetail__gallery}>
            <ProductCarousel
              images={getAllProductImages(product)}
              altText={product.name}
            />
          </div>

          <div className={styles.productDetail__body}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <span className={styles.productDetail__category}>{product.category}</span>
              {product.brand && (
                <>
                  <span style={{ color: '#666666' }}>•</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {product.brand}
                  </span>
                </>
              )}
            </div>
            <h1 className={styles.productDetail__title}>{product.name}</h1>
            <div className={styles.productDetail__price}>{formatCurrency(product.price)}</div>

            {product.description && (
              <p className={styles.productDetail__desc}>{product.description}</p>
            )}

            {/* VARIANTES INTERACTIVAS */}
            {Object.keys(variantGroups).length > 0 && (
              <div className={styles.productDetail__variants}>
                {Object.entries(variantGroups).map(([groupName, options]) => (
                  <div key={groupName} className={styles.productDetail__variantGroup}>
                    <label>
                      {groupName}:{' '}
                      <span style={{ fontWeight: 400, color: '#a3a3a3' }}>
                        {selectedVariants[groupName] || 'Selecciona'}
                      </span>
                    </label>
                    <div className={styles.options}>
                      {options.map((opt) => {
                        const isSelected = selectedVariants[groupName] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectVariant(groupName, opt)}
                            className={`${styles.optionBtn} ${
                              isSelected ? styles['optionBtn--selected'] : ''
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SELECTOR DE CANTIDAD */}
            <div className={styles.productDetail__quantity}>
              <span>Cantidad:</span>
              <div className={styles.counter}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Disminuir cantidad"
                >
                  -
                </button>
                <input
                  type="text"
                  readOnly
                  value={quantity}
                  aria-label="Cantidad seleccionada"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            {/* ACCIONES (Section 18) */}
            <div className={styles.productDetail__actions}>
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn btn--secondary btn--full btn--lg"
              >
                {addedNotice ? (
                  <>
                    <Check size={18} color="#10B981" /> ¡Agregado al carrito!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Agregar al carrito
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="btn btn--primary btn--full btn--lg"
              >
                <Zap size={18} /> Comprar ahora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Powered by Qori & KUBOstudio */}
      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.75rem', color: '#737373', borderTop: '1px solid #1f1f1f', marginTop: '2rem' }}>
        <div>
          Creado con{' '}
          <Link href="/" style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}>
            Qori<span>.</span>
          </Link>{' '}
          — Catálogo online para WhatsApp
        </div>
        <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#666666' }}>
          Desarrollado por{' '}
          <a
            href="https://kubostudio.co"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#a3a3a3', fontWeight: 600, textDecoration: 'none' }}
          >
            KUBOstudio
          </a>
        </div>
      </footer>
    </div>
  );
}
