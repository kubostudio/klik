'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore, getOrders, updateOrderStatus } from '@/lib/supabase/db';
import { Order, OrderStatus, Store } from '@/lib/supabase/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  getOrderStatusMessageText,
  getStatusWhatsAppActionLabel,
  normalizePhoneNumber,
} from '@/lib/whatsapp';
import {
  ShoppingBag,
  MessageCircle,
  Eye,
  X,
  Check,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Send,
  Info,
  LucideIcon,
} from 'lucide-react';

const FILTER_TABS: { label: string; value: 'all' | OrderStatus }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Nuevos', value: 'new' },
  { label: 'Contactados', value: 'contacted' },
  { label: 'Confirmados', value: 'confirmed' },
  { label: 'Entregados', value: 'delivered' },
  { label: 'Cancelados', value: 'cancelled' },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: LucideIcon;
  }
> = {
  new: {
    label: 'Nuevo',
    description: 'Coordinar pago y entrega inicial con el comprador.',
    color: '#facc15',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
    icon: Clock,
  },
  contacted: {
    label: 'Contactado',
    description: 'Notificar que el pedido ha sido confirmado y está en preparación.',
    color: '#93c5fd',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    icon: MessageCircle,
  },
  confirmed: {
    label: 'Confirmado',
    description: 'Avisar que el pedido ya se encuentra en proceso de entrega/despacho.',
    color: '#86efac',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    icon: CheckCircle2,
  },
  delivered: {
    label: 'Entregado',
    description: 'Confirmar entrega y agradecer la preferencia por comprar con Qori.',
    color: '#d8b4fe',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    icon: PackageCheck,
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Avisar cancelación formal e invitar a realizar una compra después.',
    color: '#f87171',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    icon: XCircle,
  },
};

import { useDashboard } from '@/contexts/DashboardContext';

export default function OrdersDashboardPage() {
  const { store: contextStore } = useDashboard();
  const [store, setStore] = useState<Store | null>(contextStore);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [activeTab, contextStore?.id]);

  const loadOrders = async () => {
    setLoading(true);
    const s = contextStore || (await getCurrentStore());
    setStore(s);
    if (s) {
      const ords = await getOrders(s.id, activeTab === 'all' ? undefined : activeTab);
      setOrders(ords);
    }
    setLoading(false);
  };

  const filteredOrders =
    activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const storeName = store?.name || 'Mi Tienda';

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    const initialText = getOrderStatusMessageText(
      order.customer_name,
      storeName,
      order.order_number,
      order.status
    );
    setCustomMessage(initialText);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        // Update template message for the new status
        const nextText = getOrderStatusMessageText(
          selectedOrder.customer_name,
          storeName,
          selectedOrder.order_number,
          newStatus
        );
        setCustomMessage(nextText);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResetMessage = () => {
    if (!selectedOrder) return;
    const defaultText = getOrderStatusMessageText(
      selectedOrder.customer_name,
      storeName,
      selectedOrder.order_number,
      selectedOrder.status
    );
    setCustomMessage(defaultText);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Pedidos de Clientes
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Gestiona los pedidos entrantes y coordina pagos y entregas por WhatsApp.
          </p>
        </div>
      </div>

      {/* FILTER TABS (Section 23) */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`btn btn--sm ${isActive ? 'btn--primary' : 'btn--secondary'}`}
              style={{ padding: '0.4rem 0.85rem' }}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <ShoppingBag size={48} />
          </div>
          <div className="empty-state__title">No hay pedidos en esta sección</div>
          <div className="empty-state__description">
            Cuando tus clientes completen el checkout de tu tienda online, sus pedidos aparecerán aquí.
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha y Hora</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{order.order_number}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {order.customer_phone}
                          {order.customer_dni && ` • DNI: ${order.customer_dni}`}
                        </div>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                        {formatDateTime(order.created_at)}
                      </td>
                      <td>
                        {order.items && order.items.length > 0 ? (
                          <div>
                            <span style={{ fontWeight: 500 }}>
                              {order.items[0].product_name} (x{order.items[0].quantity})
                            </span>
                            {order.items.length > 1 && (
                              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>
                                {' '}
                                +{order.items.length - 1} más
                              </span>
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
                        <button
                          onClick={() => handleSelectOrder(order)}
                          className="btn btn--secondary btn--sm"
                          style={{ padding: '0.4rem 0.75rem', fontWeight: 600 }}
                          title="Revisar pedido"
                        >
                          <Eye size={14} /> Revisar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL (Section 24) */}
      {selectedOrder && (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
                    Pedido #{selectedOrder.order_number}
                  </h2>
                  <span className={`badge badge--${selectedOrder.status}`}>
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', marginTop: '0.25rem' }}>
                  {formatDateTime(selectedOrder.created_at)}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'var(--color-canvas)',
                  border: 'none',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  color: 'var(--color-mid-gray)',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Datos del Cliente */}
            <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--color-surface-alt)', padding: '14px', borderRadius: '18px', border: '1px solid var(--color-hairline)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-mid-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Datos del Cliente
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem', color: 'var(--color-ink)' }}>
                {selectedOrder.customer_name}
              </div>
              {selectedOrder.customer_dni && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', marginTop: '0.15rem' }}>
                  🆔 <strong>DNI:</strong> {selectedOrder.customer_dni}
                </div>
              )}
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', marginTop: '0.15rem' }}>
                📱 <strong>WhatsApp:</strong> {selectedOrder.customer_phone}
              </div>
              {selectedOrder.customer_address && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', marginTop: '0.25rem' }}>
                  📍 <strong>Dirección:</strong> {selectedOrder.customer_address}
                </div>
              )}
              {selectedOrder.customer_reference && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                  Ref: {selectedOrder.customer_reference}
                </div>
              )}
            </div>

            {/* Productos */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-mid-gray)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                Productos ({selectedOrder.items?.length || 0})
              </div>
              <div style={{ border: '1px solid var(--color-hairline)', borderRadius: '18px', overflow: 'hidden' }}>
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                        {item.product_name} <span style={{ color: 'var(--color-mid-gray)' }}>x{item.quantity}</span>
                      </div>
                      {item.variant_data && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>
                          {Object.entries(item.variant_data)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.85rem',
                    backgroundColor: 'var(--color-surface-alt)',
                    fontWeight: 600,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--color-ink)', fontSize: '1rem' }}>
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Estado Mejorado */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-mid-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Estado del Pedido
                </div>
                {updatingStatus && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink)', fontWeight: 500 }}>
                    Actualizando...
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
                {(['new', 'contacted', 'confirmed', 'delivered', 'cancelled'] as OrderStatus[]).map(
                  (status) => {
                    const isSelected = selectedOrder.status === status;
                    const cfg = STATUS_CONFIG[status];
                    const IconComponent = cfg.icon;

                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(selectedOrder.id, status)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          padding: '0.55rem 0.25rem',
                          borderRadius: '18px',
                          border: isSelected
                            ? `1px solid var(--color-ink)`
                            : '1px solid var(--color-hairline)',
                          backgroundColor: isSelected ? cfg.bgColor : 'var(--color-paper)',
                          color: isSelected ? cfg.color : 'var(--color-mid-gray)',
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.7rem',
                          cursor: updatingStatus ? 'wait' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <IconComponent size={15} color={isSelected ? cfg.color : 'var(--color-mid-gray)'} />
                        <span style={{ lineHeight: 1.1 }}>{cfg.label}</span>
                      </button>
                    );
                  }
                )}
              </div>

              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: STATUS_CONFIG[selectedOrder.status].color,
                  backgroundColor: STATUS_CONFIG[selectedOrder.status].bgColor,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '14px',
                  border: `1px solid ${STATUS_CONFIG[selectedOrder.status].borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Info size={15} />
                <span>{STATUS_CONFIG[selectedOrder.status].description}</span>
              </div>
            </div>

            {/* Previsualización Editable del Mensaje a Enviar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <label
                  htmlFor="whatsapp-message-preview"
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--color-mid-gray)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Mensaje a enviar por WhatsApp
                </label>
                <button
                  type="button"
                  onClick={handleResetMessage}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 0,
                  }}
                  title="Restablecer al texto predeterminado según el estado"
                >
                  <RotateCcw size={12} /> Restablecer plantilla
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <textarea
                  id="whatsapp-message-preview"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '14px',
                    border: '1px solid var(--color-hairline)',
                    fontSize: '0.8125rem',
                    lineHeight: '1.45',
                    color: 'var(--color-ink)',
                    backgroundColor: 'var(--color-canvas)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  placeholder="Escribe el mensaje que se enviará al cliente..."
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-mid-gray)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Puedes editar libremente este mensaje antes de enviarlo.</span>
                <span>{customMessage.length} caracteres</span>
              </div>
            </div>

            {/* CTA Contactar por WhatsApp con Mensaje Personalizado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a
                href={`https://wa.me/${normalizePhoneNumber(selectedOrder.customer_phone)}?text=${encodeURIComponent(customMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--whatsapp btn--full btn--lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                  padding: '0.75rem 1rem',
                  fontSize: '0.925rem',
                  borderRadius: '10px',
                }}
              >
                <MessageCircle size={19} /> Enviar WhatsApp ({getStatusWhatsAppActionLabel(selectedOrder.status)})
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
