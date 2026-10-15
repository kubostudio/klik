"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "@/styles/modules/store.module.scss";
import { getStoreBySlug, getProducts } from "@/lib/supabase/db";
import { cartManager, CartItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import { Store, Product } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingCart,
  ArrowRight,
  Instagram,
  MessageCircle,
  MapPin,
  Package,
  Camera,
  Clock,
} from "lucide-react";

export default function PublicStoreCatalogPage() {
  const params = useParams();
  const storeSlug = (params?.storeSlug as string) || "";

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      const s = await getStoreBySlug(storeSlug);
      setStore(s);

      if (s) {
        const prods = await getProducts(s.id, true, s.product_sort_mode || undefined);
        setProducts(prods);

        trackEvent({
          storeId: s.id,
          eventType: "store_view",
          metadata: {
            slug: storeSlug,
            referrer: typeof document !== "undefined" ? document.referrer : "",
          },
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
    window.addEventListener("klik-cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("klik-cart-updated", handleCartUpdate);
    };
  }, [storeSlug]);

  if (loading) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: "5rem 1rem", textAlign: "center" }}>
          <p style={{ color: "#a3a3a3", fontSize: "0.9375rem" }}>
            Cargando tienda...
          </p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: "5rem 1rem", textAlign: "center" }}>
          <div
            className="empty-state"
            style={{ maxWidth: "420px", margin: "0 auto" }}
          >
            <div className="empty-state__icon">
              <Package size={44} />
            </div>
            <div className="empty-state__title">Tienda no encontrada</div>
            <div className="empty-state__description">
              La tienda &quot;{storeSlug}&quot; no existe o ha cambiado de
              dirección.
            </div>
            <Link
              href="/"
              className="btn btn--primary btn--sm"
              style={{ marginTop: "1rem" }}
            >
              Ir a Klik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Tienda inactiva o pendiente de activación
  if (store.is_active === false) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: "5rem 1rem", textAlign: "center" }}>
          <div
            className="empty-state"
            style={{
              maxWidth: "460px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              padding: "2.5rem 1.5rem",
              borderRadius: "16px",
            }}
          >
            <div
              className="empty-state__icon"
              style={{
                backgroundColor: "#fff7ed",
                color: "#d97742",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Clock size={32} />
            </div>
            <div
              className="empty-state__title"
              style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}
            >
              {store.name}
            </div>
            <div
              className="empty-state__description"
              style={{ fontSize: "0.9rem", color: "#666", lineHeight: 1.5 }}
            >
              Esta tienda se encuentra temporalmente inactiva o en proceso de activación.
            </div>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "#888",
                marginTop: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              Si eres el propietario de esta tienda, por favor comunícate con KUBOstudio para habilitar tu catálogo.
            </p>
            <a
              href={`https://wa.me/51906013310?text=${encodeURIComponent(
                `Hola KUBOstudio, soy el propietario de la tienda ${store.name} (slug: ${store.slug}) y solicito activarla.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--sm"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "0 auto",
              }}
            >
              <MessageCircle size={15} /> Contactar a KUBOstudio
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Categorías únicas
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category || "General"))),
  ];

  // Filtrar productos agotados (stock === 0) de la vista pública (los productos a pedido siempre se muestran)
  const availableProducts = products.filter(
    (p) => p.on_demand || p.stock === null || p.stock === undefined || p.stock > 0
  );

  const filteredProducts =
    selectedCategory === "all"
      ? availableProducts
      : availableProducts.filter((p) => (p.category || "General") === selectedCategory);

  const cartTotalCount = cartManager.getTotalCount(cartItems);
  const cartSubtotal = cartManager.getSubtotal(cartItems);

  return (
    <div className={styles.storeContainer}>
      <div className={styles.storeContent}>
        {/* STORE HEADER (Section 17) */}
        <header className={styles.header}>
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className={styles.header__logo}
            />
          ) : (
            <div className={styles.header__logoPlaceholder}>
              {store.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className={styles.header__content}>
            <div className={styles.header__titleRow}>
              <h1 className={styles.header__name}>{store.name}</h1>
              {store.city && (
                <span className={styles.header__city}>
                  <MapPin size={14} /> {store.city}
                </span>
              )}
            </div>

            {store.description && (
              <p className={styles.header__desc}>{store.description}</p>
            )}

            <div className={styles.header__meta}>
              {store.instagram && (
                <a
                  href={`https://instagram.com/${store.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={14} /> {store.instagram.replace(/^@/, "")}
                </a>
              )}
              {store.whatsapp && (
                <a
                  href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
            </div>
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
                  selectedCategory === cat ? styles["catPill--active"] : ""
                }`}
              >
                {cat === "all" ? "Todos los productos" : cat}
              </button>
            ))}
          </div>
        )}

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Package size={44} />
            </div>
            <div className="empty-state__title">
              Esta tienda todavía no tiene productos disponibles
            </div>
            <div className="empty-state__description">
              Vuelve a consultar pronto o escribe por WhatsApp para consultar el
              catálogo.
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
                      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&fit=crop"
                    }
                    alt={prod.name}
                    loading="lazy"
                  />
                  {prod.on_demand && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        backgroundColor: "var(--color-primary)",
                        color: "#ffffff",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                        letterSpacing: "0.02em",
                        zIndex: 2,
                      }}
                    >
                      A pedido
                    </span>
                  )}
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
                        <span style={{ margin: "0 0.25rem", opacity: 0.6 }}>
                          •
                        </span>
                        <span style={{ fontWeight: 600 }}>{prod.brand}</span>
                      </>
                    )}
                  </div>
                  <Link href={`/${storeSlug}/product/${prod.slug}`}>
                    <h3 className={styles.productCard__name}>{prod.name}</h3>
                  </Link>

                  {/* Visualización de stock según configuración de la tienda (no aplica a productos a pedido) */}
                  {!prod.on_demand && prod.show_stock !== false && prod.stock !== null && prod.stock !== undefined && (
                    <div style={{ marginBottom: "0.4rem" }}>
                      {prod.stock <= 3 ? (
                        <span
                          style={{
                            fontSize: "0.725rem",
                            fontWeight: 600,
                            color: "#ca8a04",
                            backgroundColor: "rgba(234, 179, 8, 0.12)",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            display: "inline-block",
                          }}
                        >
                          ¡Últimas {prod.stock} disponibles!
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.725rem",
                            fontWeight: 500,
                            color: "var(--color-mid-gray)",
                            backgroundColor: "var(--color-canvas)",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            display: "inline-block",
                            border: "1px solid var(--color-hairline)",
                          }}
                        >
                          {prod.stock} disponibles
                        </span>
                      )}
                    </div>
                  )}

                  {/* Precio o indicador de consulta según show_price y si es a pedido */}
                  {prod.show_price === false || (prod.on_demand && (!prod.price || prod.price <= 0)) ? (
                    <div
                      className={styles.productCard__price}
                      style={{
                        fontSize: "0.875rem",
                        color: prod.on_demand ? "var(--color-primary)" : "var(--color-mid-gray)",
                        fontWeight: 600,
                        fontStyle: prod.on_demand ? "normal" : "italic",
                      }}
                    >
                      Precio a consultar
                    </div>
                  ) : (
                    <div className={styles.productCard__price}>
                      {formatCurrency(prod.price)}
                      {prod.on_demand && (
                        <span style={{ fontSize: "0.68rem", color: "var(--color-mid-gray)", fontWeight: 400, marginLeft: "4px" }}>
                          (ref.)
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.productCard__cta}>
                    {prod.on_demand ? (
                      <div style={{ display: "flex", gap: "0.4rem", width: "100%" }}>
                        <Link
                          href={`/${storeSlug}/product/${prod.slug}`}
                          className="btn btn--secondary btn--sm"
                          style={{ flex: 1, padding: "0 0.5rem", fontSize: "0.78rem" }}
                        >
                          Ver
                        </Link>
                        <a
                          href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola ${store.name}, me interesa separar el producto a pedido: *${prod.name}* (https://klik.sale/${storeSlug}/product/${prod.slug}). Deseo información para separarlo.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--primary btn--sm"
                          style={{
                            flex: 2,
                            backgroundColor: "#d97742",
                            borderColor: "#d97742",
                            color: "#ffffff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.25rem",
                            fontSize: "0.78rem",
                            padding: "0 0.4rem",
                            textDecoration: "none",
                          }}
                        >
                          <MessageCircle size={13} /> Separar
                        </a>
                      </div>
                    ) : (
                      <Link
                        href={`/${storeSlug}/product/${prod.slug}`}
                        className="btn btn--secondary btn--full btn--sm"
                      >
                        Ver producto
                      </Link>
                    )}
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
              <div className={styles.subtotal}>
                {formatCurrency(cartSubtotal)}
              </div>
            </div>
            <div className={styles.cta}>
              Ver mi carrito <ArrowRight size={14} />
            </div>
          </Link>
        )}
      </div>

      {/* Powered by Klik & KUBOstudio */}
      <footer
        style={{
          textAlign: "center",
          padding: "1.5rem 1rem",
          fontSize: "0.75rem",
          color: "#737373",
          borderTop: "1px solid #1f1f1f",
          marginTop: "2rem",
        }}
      >
        <div>
          Creado con{" "}
          <Link
            href="/"
            style={{
              color: "#d97742",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Klik<span>.</span>
          </Link>{" "}
          — Catálogo online para WhatsApp
        </div>
        <div
          style={{ marginTop: "0.35rem", fontSize: "0.7rem", color: "#666666" }}
        >
          Desarrollado por{" "}
          <a
            href="https://kubostudio.co"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#d97742",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            KUBOstudio
          </a>
        </div>
      </footer>
    </div>
  );
}
