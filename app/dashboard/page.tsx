'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore, getOrders, getProducts, getCustomers, getAnalyticsSummary } from '@/lib/supabase/db';
import { Store, Order, Product } from '@/lib/supabase/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { buildSellerContactWhatsAppUrl } from '@/lib/whatsapp';
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Percent,
  Plus,
  ArrowRight,
  MessageCircle,
  Share2,
  CheckCircle2,
  Circle,
  Eye,
} from 'lucide-react';

export default function DashboardHomePage() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [analytics, setAnalytics] = useState({ storeViews: 0, conversionRate: '0.0' });
  const [sellerName, setSellerName] = useState('Emprendedor');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const s = await getCurrentStore();
      setStore(s);

      if (s) {
        const [ord, prod, cust, anal] = await Promise.all([
          getOrders(s.id),
          getProducts(s.id),
          getCustomers(s.id),
          getAnalyticsSummary(s.id),
        ]);
        setOrders(ord);
        setProducts(prod);
        setCustomerCount(cust.length);
        setAnalytics({ storeViews: anal.storeViews, conversionRate: anal.conversionRate });
      }

      try {
        const session = localStorage.getItem('qori_seller_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.name) setSellerName(parsed.name.split(' ')[0]);
        }
      } catch {}

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const totalOrdersCount = orders.length;
  const totalSales = orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? Number(o.total || 0) : 0), 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      {/* GREETING HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Buenos días, {sellerName}.
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Aquí tienes el resumen operativo de tu tienda hoy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/dashboard/products" className="btn btn--secondary btn--sm">
            <Plus size={14} /> Producto
          </Link>
          <Link href="/dashboard/orders" className="btn btn--primary btn--sm">
            Ver pedidos
          </Link>
        </div>
      </div>

      {/* ONBOARDING PROGRESS */}
      {products.length === 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-ink-soft)',
            border: '1px solid var(--color-ink-soft)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '1.5rem',
            color: '#fafafa',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#fafafa', marginBottom: '0.5rem' }}>
            Empieza creando tu primer producto
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#a3a3a3', marginBottom: '1rem' }}>
            Tu tienda está creada. Para recibir tus primeros pedidos, agrega un artículo a tu catálogo.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a3a3a3' }}>
              <CheckCircle2 size={16} /> Cuenta creada
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a3a3a3' }}>
              <CheckCircle2 size={16} /> Tienda creada
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fafafa', fontWeight: 600 }}>
              <Circle size={16} /> Agregar productos
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a3a3a3' }}>
              <Circle size={16} /> Publicar catálogo
            </div>
          </div>
          <Link href="/dashboard/products" className="btn btn--secondary btn--sm">
            <Plus size={14} /> Agregar primer producto
          </Link>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pedidos</div>
          <div className={styles.statValue}>{totalOrdersCount}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ventas</div>
          <div className={styles.statValue}>{formatCurrency(totalSales)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Clientes</div>
          <div className={styles.statValue}>{customerCount}</div>
        </div>
      </div>

      {/* RECENT ORDERS PANEL */}
      <div className={styles.panel}>
        <div className={styles.panel__header}>
          <h2>Pedidos recientes</h2>
          <Link
            href="/dashboard/orders"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 500,
            }}
          >
            Ver todos los pedidos <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state" style={{ border: 'none', padding: '3rem 1rem' }}>
            <div className="empty-state__icon">
              <ShoppingBag size={40} />
            </div>
            <div className="empty-state__title">Tus primeros pedidos aparecerán aquí</div>
            <div className="empty-state__description">
              Comparte tu enlace de Qori en tus redes sociales para empezar a recibir pedidos por WhatsApp.
            </div>
            {store?.slug && (
              <Link href={`/${store.slug}`} target="_blank" className="btn btn--secondary btn--sm">
                Visitar mi tienda pública
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{order.order_number}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>
                          {order.customer_phone}
                          {order.customer_dni && ` • DNI: ${order.customer_dni}`}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-mid-gray)' }}>{formatDate(order.created_at)}</td>
                      <td>
                        {order.items && order.items.length > 0 ? (
                          <div style={{ fontSize: '0.8125rem' }}>
                            {order.items[0].product_name}
                            {order.items.length > 1 && (
                              <span style={{ color: 'var(--color-mid-gray)' }}> +{order.items.length - 1} más</span>
                            )}
                          </div>
                        ) : (
                          '1 producto'
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                      <td>
                        <span className={`badge badge--${order.status}`}>
                          {order.status === 'new' && 'Nuevo'}
                          {order.status === 'contacted' && 'Contactado'}
                          {order.status === 'confirmed' && 'Confirmado'}
                          {order.status === 'delivered' && 'Entregado'}
                          {order.status === 'cancelled' && 'Cancelado'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href="/dashboard/orders"
                          className="btn btn--secondary btn--sm"
                          style={{ padding: '0.35rem 0.65rem' }}
                          title="Revisar pedido"
                        >
                          <Eye size={13} /> Revisar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
