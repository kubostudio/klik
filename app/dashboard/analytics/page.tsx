'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore, getAnalyticsSummary, getProducts, getCustomers } from '@/lib/supabase/db';
import { formatCurrency } from '@/lib/utils';
import { Product, Store } from '@/lib/supabase/types';
import { BarChart3, Eye, ShoppingCart, ShoppingBag, TrendingUp, Users } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState({
    storeViews: 0,
    productViews: 0,
    cartAdds: 0,
    totalOrders: 0,
    totalSales: 0,
    conversionRate: '0.0',
  });
  const [repeatCustomers, setRepeatCustomers] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      const s = await getCurrentStore();
      setStore(s);
      if (s) {
        const [sum, prods, custs] = await Promise.all([
          getAnalyticsSummary(s.id),
          getProducts(s.id),
          getCustomers(s.id),
        ]);
        setSummary(sum);
        setProducts(prods);

        const repeat = custs.filter((c) => c.total_orders > 1).length;
        setRepeatCustomers(repeat);
        setNewCustomers(custs.length - repeat);
      }
      setLoading(false);
    }

    loadAnalytics();
  }, []);

  const storeViews = summary.storeViews;
  const productViews = summary.productViews;
  const cartAdds = summary.cartAdds;
  const totalOrders = summary.totalOrders;
  const totalSales = summary.totalSales;
  const conversionRate = summary.conversionRate;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
            Estadísticas de la Tienda
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Rendimiento de visitas, embudo y conversión en tiempo real.
          </p>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES (Section 28) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Visitas a la Tienda</div>
          <div className={styles.statValue}>{storeViews}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Productos Vistos</div>
          <div className={styles.statValue}>{productViews}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Agregados al Carrito</div>
          <div className={styles.statValue}>{cartAdds}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tasa de Conversión</div>
          <div className={styles.statValue}>{conversionRate}%</div>
        </div>
      </div>

      {/* EMBUDO DE COMPRA */}
      <div className={styles.panel}>
        <div className={styles.panel__header}>
          <h2>Embudo de Conversión (Redes a WhatsApp)</h2>
        </div>
        <div className={styles.panel__body}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>1. Visitas a catálogo</span>
                <strong>{storeViews} (100%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#262626', borderRadius: '4px' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>2. Visualización de productos</span>
                <strong>{productViews} ({((productViews / storeViews) * 100).toFixed(0)}%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#262626', borderRadius: '4px' }}>
                <div
                  style={{
                    width: `${Math.min(100, (productViews / storeViews) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#60a5fa',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>3. Agregados al carrito</span>
                <strong>{cartAdds} ({((cartAdds / storeViews) * 100).toFixed(0)}%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#262626', borderRadius: '4px' }}>
                <div
                  style={{
                    width: `${Math.min(100, (cartAdds / storeViews) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#facc15',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>4. Pedidos completados para WhatsApp</span>
                <strong>{totalOrders} ({conversionRate}%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#262626', borderRadius: '4px' }}>
                <div
                  style={{
                    width: `${Math.max(4, Math.min(100, parseFloat(conversionRate) * 4))}%`,
                    height: '100%',
                    backgroundColor: '#25D366',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLAS DE PRODUCTOS Y CLIENTES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <h2>Productos más vistos y demandados</h2>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td>{formatCurrency(prod.price)}</td>
                    <td>{prod.category}</td>
                    <td>
                      <span className="badge badge--confirmed">Disponible</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <h2>Comportamiento de Compradores</h2>
          </div>
          <div className={styles.panel__body} style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Clientes Nuevos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink)' }}>{newCustomers}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Clientes Recurrentes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#facc15' }}>
                {repeatCustomers}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Ticket Promedio</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                {formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
