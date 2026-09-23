'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore, getFollowUps, getCustomers, getOrders } from '@/lib/supabase/db';
import { Store, FollowUp, Order, Customer } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils';
import { buildFollowUpWhatsAppUrl } from '@/lib/whatsapp';
import { MessageCircle, Clock, CheckCircle, CheckCircle2, Search, AlertCircle, Settings, Check } from 'lucide-react';

import { useDashboard } from '@/contexts/DashboardContext';

export default function FollowUpsDashboardPage() {
  const { store: contextStore } = useDashboard();
  const [store, setStore] = useState<Store | null>(contextStore);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuración Pro (Section 27)
  const [autoUnconfirmed, setAutoUnconfirmed] = useState(true);
  const [autoPostPurchase, setAutoPostPurchase] = useState(true);
  const [autoInactive, setAutoInactive] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const s = contextStore || (await getCurrentStore());
      setStore(s);
      if (s) {
        const [fu, custs, ords] = await Promise.all([
          getFollowUps(s.id),
          getCustomers(s.id),
          getOrders(s.id),
        ]);
        setFollowUps(fu);
        setCustomers(custs);
        setOrders(ords);
      }
      setLoading(false);
    }

    loadData();
  }, [contextStore?.id]);

  const isPro = store?.plan === 'pro';

  // Oportunidades manuales detectadas
  const pendingOrders = orders.filter((o) => o.status === 'new');
  const postPurchaseOrders = orders.filter((o) => {
    if (o.status !== 'delivered') return false;
    const orderDate = new Date(o.created_at).getTime();
    const updateDate = o.updated_at ? new Date(o.updated_at).getTime() : orderDate;
    const diffDaysFromCreated = (Date.now() - orderDate) / (1000 * 60 * 60 * 24);
    const diffDaysFromUpdate = (Date.now() - updateDate) / (1000 * 60 * 60 * 24);
    return diffDaysFromCreated >= 7 || diffDaysFromUpdate >= 7;
  });
  const inactiveCustomers = customers.filter((c) => {
    if (!c.last_order_at) return false;
    const diffDays = (Date.now() - new Date(c.last_order_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 30;
  });

  const storeName = store?.name || 'Mi Tienda';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Seguimiento de Clientes
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Identifica compradores para reactivar y cerrar más ventas por WhatsApp.
          </p>
        </div>
      </div>

      {/* SECCIÓN AUTOMATIZACIONES */}
      <div className={styles.panel}>
        <div className={styles.panel__header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--color-ink)" />
            <h2 style={{ color: 'var(--color-ink)' }}>
              Seguimiento automatizado
            </h2>
          </div>
        </div>

        <div className={styles.panel__body}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-mid-gray)', marginBottom: '1rem' }}>
            Configura recordatorios para pedidos que aún no han sido confirmados. También puedes activar el seguimiento post-compra para consultar la satisfacción de tus clientes o la reactivación de clientes inactivos. 
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <label className={styles.checkboxCard}>
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  className={styles.hiddenInput}
                  checked={autoUnconfirmed}
                  onChange={(e) => setAutoUnconfirmed(e.target.checked)}
                />
                <div className={`${styles.customBox} ${autoUnconfirmed ? styles.checked : ''}`}>
                  {autoUnconfirmed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
              </div>
              <div className={styles.content}>
                <span className={styles.title}>Pedido no confirmado</span>
                <span className={styles.desc}>— Recordatorio tras 24 horas</span>
              </div>
            </label>

            <label className={styles.checkboxCard}>
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  className={styles.hiddenInput}
                  checked={autoPostPurchase}
                  onChange={(e) => setAutoPostPurchase(e.target.checked)}
                />
                <div className={`${styles.customBox} ${autoPostPurchase ? styles.checked : ''}`}>
                  {autoPostPurchase && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
              </div>
              <div className={styles.content}>
                <span className={styles.title}>Seguimiento post-compra</span>
                <span className={styles.desc}>— Consulta de satisfacción tras 7 días</span>
              </div>
            </label>

            <label className={styles.checkboxCard}>
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  className={styles.hiddenInput}
                  checked={autoInactive}
                  onChange={(e) => setAutoInactive(e.target.checked)}
                />
                <div className={`${styles.customBox} ${autoInactive ? styles.checked : ''}`}>
                  {autoInactive && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
              </div>
              <div className={styles.content}>
                <span className={styles.title}>Cliente inactivo</span>
                <span className={styles.desc}>— Reactivación tras 30 días de inactividad</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* SECCIÓN STARTER / MANUAL: OPORTUNIDADES DETECTADAS (Section 26) */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '1rem' }}>
        Oportunidades de Contacto Manual
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Pedidos sin confirmar */}
        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--color-ink)" />
              <h3>Pedidos pendientes de confirmación ({pendingOrders.length})</h3>
            </div>
          </div>
          <div className={styles.panel__body}>
            {pendingOrders.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                Todos los pedidos han sido contactados o confirmados.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingOrders.map((ord) => {
                  const url = buildFollowUpWhatsAppUrl(
                    ord.customer_phone,
                    ord.customer_name,
                    store?.name || 'Mi Tienda',
                    'pending_order'
                  );

                  return (
                    <div
                      key={ord.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--color-surface-alt)',
                        borderRadius: '16px',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                          {ord.customer_name} — Pedido #{ord.order_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', marginTop: '2px' }}>
                          Creado el {formatDate(ord.created_at)} • {ord.customer_phone}
                        </div>
                      </div>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--primary btn--sm"
                      >
                        <MessageCircle size={14} /> Contactar por WhatsApp
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Seguimiento post-compra */}
        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--color-ink)" />
              <h3>Seguimiento post-compra tras 7 días ({postPurchaseOrders.length})</h3>
            </div>
          </div>
          <div className={styles.panel__body}>
            {postPurchaseOrders.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                No hay pedidos entregados hace más de 7 días pendientes de consulta.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {postPurchaseOrders.map((ord) => {
                  const url = buildFollowUpWhatsAppUrl(
                    ord.customer_phone,
                    ord.customer_name,
                    storeName,
                    'post_purchase',
                    ord.order_number
                  );

                  return (
                    <div
                      key={ord.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--color-surface-alt)',
                        borderRadius: '16px',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                          {ord.customer_name} — Pedido #{ord.order_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', marginTop: '2px' }}>
                          Entregado hace más de 7 días • {formatDate(ord.created_at)} • {ord.customer_phone}
                        </div>
                      </div>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--primary btn--sm"
                      >
                        <MessageCircle size={14} /> Contactar por WhatsApp
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clientes inactivos */}
        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color="var(--color-ink)" />
              <h3>Clientes inactivos (+30 días sin comprar) ({inactiveCustomers.length})</h3>
            </div>
          </div>
          <div className={styles.panel__body}>
            {inactiveCustomers.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                No tienes clientes inactivos por el momento.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inactiveCustomers.map((cust) => {
                  const url = buildFollowUpWhatsAppUrl(
                    cust.phone,
                    cust.name,
                    store?.name || 'Mi Tienda',
                    'inactive_customer'
                  );

                  return (
                    <div
                      key={cust.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--color-surface-alt)',
                        borderRadius: '16px',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>{cust.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', marginTop: '2px' }}>
                          Última compra hace más de 30 días • {cust.total_orders} compras anteriores
                        </div>
                      </div>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--primary btn--sm"
                      >
                        <MessageCircle size={14} /> Contactar por WhatsApp
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
