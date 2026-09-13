'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore, getCustomers, getOrders } from '@/lib/supabase/db';
import { Customer, Order, Store } from '@/lib/supabase/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { buildFollowUpWhatsAppUrl } from '@/lib/whatsapp';
import { Users, MessageCircle, X, ShoppingBag, Eye } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

import { useDashboard } from '@/contexts/DashboardContext';

export default function CustomersDashboardPage() {
  const { store: contextStore } = useDashboard();
  const [store, setStore] = useState<Store | null>(contextStore);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const s = contextStore || (await getCurrentStore());
      setStore(s);
      if (s) {
        const [custs, ords] = await Promise.all([
          getCustomers(s.id),
          getOrders(s.id),
        ]);
        setCustomers(custs);
        setOrders(ords);
      }
      setLoading(false);
    }

    loadData();
  }, [contextStore?.id]);

  const storeName = store?.name || 'Mi Tienda';

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customer_phone.replace(/\D/g, '') === selectedCustomer.phone.replace(/\D/g, '')
      )
    : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Directorio de Clientes
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Historial de compradores acumulado automáticamente con cada pedido.
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Users size={48} />
          </div>
          <div className="empty-state__title">Aún no tienes clientes registrados</div>
          <div className="empty-state__description">
            A medida que tus clientes ingresen sus datos en el checkout, quedarán organizados aquí.
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>DNI</th>
                  <th>WhatsApp</th>
                  <th>Pedidos</th>
                  <th>Total Gastado</th>
                  <th>Última Compra</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => {
                  const whatsappUrl = buildFollowUpWhatsAppUrl(
                    cust.phone,
                    cust.name,
                    storeName,
                    'inactive_customer'
                  );

                  return (
                    <tr key={cust.id}>
                      <td style={{ fontWeight: 600 }}>{cust.name}</td>
                      <td style={{ fontSize: '0.8125rem', color: cust.dni ? 'var(--color-ink)' : 'var(--color-mid-gray)', fontWeight: cust.dni ? 500 : 400 }}>
                        {cust.dni || '—'}
                      </td>
                      <td>{cust.phone}</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{cust.total_orders}</span> pedido(s)
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                        {formatCurrency(cust.total_spent)}
                      </td>
                      <td style={{ color: 'var(--color-mid-gray)', fontSize: '0.8125rem' }}>
                        {cust.last_order_at ? formatDate(cust.last_order_at) : 'Reciente'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="btn btn--secondary btn--sm"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title="Ver ficha del cliente"
                          >
                            <Eye size={13} /> Ver historial
                          </button>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--whatsapp btn--sm"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title="Escribir por WhatsApp"
                          >
                            <MessageCircle size={13} /> Chat
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL (Section 25) */}
      {selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 10, 10, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-paper)',
              borderRadius: '24px',
              border: '1px solid var(--color-hairline)',
              boxShadow: 'var(--shadow-subtle)',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
                  {selectedCustomer.name}
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)', marginTop: '0.15rem' }}>
                  {selectedCustomer.dni ? `DNI: ${selectedCustomer.dni} • ` : ''}📱 {selectedCustomer.phone}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: 'var(--color-canvas)',
                  border: 'none',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  color: 'var(--color-mid-gray)',
                  padding: '0.4rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Métricas del Cliente */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ backgroundColor: 'var(--color-surface-alt)', padding: '12px', borderRadius: '18px', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Pedidos</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                  {selectedCustomer.total_orders}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--color-surface-alt)', padding: '12px', borderRadius: '18px', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Total Gastado</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                  {formatCurrency(selectedCustomer.total_spent)}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--color-surface-alt)', padding: '12px', borderRadius: '18px', border: '1px solid var(--color-hairline)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Última Compra</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                  {selectedCustomer.last_order_at ? formatDate(selectedCustomer.last_order_at) : '-'}
                </div>
              </div>
            </div>

            {selectedCustomer.address && (
              <div style={{ marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                📍 <strong>Dirección:</strong> {selectedCustomer.address}
              </div>
            )}

            {/* Historial de Pedidos */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '0.5rem' }}>
                Historial de Pedidos ({customerOrders.length})
              </h3>
              {customerOrders.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                  No se encontraron pedidos registrados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--color-hairline)',
                        borderRadius: '18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                          Pedido #{ord.order_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>
                          {formatDate(ord.created_at)} • {ord.items?.length || 1} producto(s)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                          {formatCurrency(ord.total)}
                        </div>
                        <span className={`badge badge--${ord.status}`} style={{ fontSize: '0.6875rem' }}>
                          {STATUS_LABELS[ord.status] || ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <a
              href={buildFollowUpWhatsAppUrl(
                selectedCustomer.phone,
                selectedCustomer.name,
                storeName,
                'inactive_customer'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--full btn--lg"
            >
              <MessageCircle size={18} /> Escribir por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
