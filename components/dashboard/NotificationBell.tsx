'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/contexts/DashboardContext';
import { getOrders, supabase } from '@/lib/supabase/db';
import { Order } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/utils';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function NotificationBell() {
  const router = useRouter();
  const { store } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageKey = store?.id ? `klik_read_orders_${store.id}` : null;

  // Cargar órdenes y lecturas desde localStorage
  const loadNotifications = useCallback(async () => {
    if (!store?.id) return;
    try {
      const ords = await getOrders(store.id);
      setOrders(ords || []);

      if (storageKey && typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed: string[] = JSON.parse(stored);
            setReadOrderIds(new Set(parsed));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Error loading notifications in bell:', err);
    }
  }, [store?.id, storageKey]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Escuchar eventos en tiempo real para actualizar la lista al instante
  useEffect(() => {
    if (!store?.id) return;

    const handleInstantOrder = (e: any) => {
      loadNotifications();
    };

    window.addEventListener('klik-order-received', handleInstantOrder);

    // Canal con identificador único para evitar colisiones entre instancias (desktop y mobile)
    const channelName = `bell-live-${store.id}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${store.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('klik-order-received', handleInstantOrder);
      supabase.removeChannel(channel);
    };
  }, [store?.id, loadNotifications]);

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Guardar IDs leídos en localStorage
  const persistReadIds = (newSet: Set<string>) => {
    setReadOrderIds(newSet);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
      } catch {}
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = new Set(orders.map((o) => o.id));
    persistReadIds(allIds);
  };

  const handleItemClick = (order: Order) => {
    const next = new Set(readOrderIds);
    next.add(order.id);
    persistReadIds(next);
    setIsOpen(false);
    router.push('/dashboard/orders');
  };

  // Cantidad de notificaciones sin leer
  const unreadCount = orders.filter((o) => !readOrderIds.has(o.id)).length;

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'Hace un momento';
    if (diffSecs < 3600) return `Hace ${Math.floor(diffSecs / 60)} min`;
    if (diffSecs < 86400) return `Hace ${Math.floor(diffSecs / 3600)} h`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ver notificaciones"
        title="Notificaciones de pedidos"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: isOpen ? 'rgba(217, 119, 66, 0.12)' : 'var(--color-paper, #ffffff)',
          border: '1px solid rgba(217, 119, 66, 0.25)',
          color: unreadCount > 0 || isOpen ? '#d97742' : 'var(--color-ink, #232323)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 3px rgba(35, 15, 5, 0.05)',
        }}
      >
        <Bell size={18} />

        {/* Contador de notificaciones sin leer */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '9px',
              backgroundColor: '#d97742',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(217, 119, 66, 0.4)',
              animation: 'klikBadgePulse 2s infinite ease-in-out',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes klikBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .notif-item-hover:hover {
          background-color: rgba(217, 119, 66, 0.06) !important;
        }
      `}</style>

      {/* Menú Dropdown de Notificaciones */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 2rem)',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(217, 119, 66, 0.22)',
            borderRadius: '16px',
            boxShadow:
              '0 20px 45px -8px rgba(35, 15, 5, 0.16), 0 6px 18px rgba(35, 15, 5, 0.08)',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily:
              "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            animation: 'klikDropdownPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <style>{`
            @keyframes klikDropdownPop {
              0% { transform: translateY(-8px) scale(0.97); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>

          {/* Cabecera del Dropdown */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid rgba(35, 20, 10, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fdf7f2',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#232323' }}>
                Notificaciones
              </span>
              {unreadCount > 0 ? (
                <span
                  style={{
                    backgroundColor: 'rgba(217, 119, 66, 0.12)',
                    color: '#d97742',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '12px',
                  }}
                >
                  {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'rgba(35, 35, 35, 0.5)',
                  }}
                >
                  Al día
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'none',
                  border: 'none',
                  color: '#d97742',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
                title="Marcar todas como leídas"
              >
                <CheckCheck size={14} /> Marcar leídas
              </button>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '0.35rem 0',
            }}
          >
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(217, 119, 66, 0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97742',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Bell size={20} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#232323' }}>
                  No hay notificaciones
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(35, 35, 35, 0.55)',
                    marginTop: '0.2rem',
                  }}
                >
                  Los nuevos pedidos que ingresen a tu tienda se mostrarán aquí en tiempo real.
                </div>
              </div>
            ) : (
              orders.slice(0, 20).map((order) => {
                const isUnread = !readOrderIds.has(order.id);
                return (
                  <div
                    key={order.id}
                    onClick={() => handleItemClick(order)}
                    className="notif-item-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(35, 20, 10, 0.05)',
                      backgroundColor: isUnread ? 'rgba(217, 119, 66, 0.03)' : '#ffffff',
                      transition: 'background-color 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Indicador de no leído */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: isUnread
                          ? 'rgba(217, 119, 66, 0.12)'
                          : 'rgba(35, 20, 10, 0.05)',
                        color: isUnread ? '#d97742' : 'rgba(35, 35, 35, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <ShoppingBag size={17} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.25rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isUnread ? 700 : 600,
                            color: '#232323',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {order.customer_name}
                        </span>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'rgba(35, 35, 35, 0.5)',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {formatRelativeTime(order.created_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.15rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#d97742',
                          }}
                        >
                          {formatCurrency(order.total)}
                        </span>

                        {order.order_number && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'rgba(35, 35, 35, 0.5)',
                            }}
                          >
                            Orden #{order.order_number}
                          </span>
                        )}

                        {order.status && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor:
                                order.status === 'new'
                                  ? 'rgba(234, 179, 8, 0.15)'
                                  : 'rgba(34, 197, 94, 0.15)',
                              color: order.status === 'new' ? '#ca8a04' : '#16a34a',
                            }}
                          >
                            {order.status === 'new' ? 'Nuevo' : order.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dot no leído */}
                    {isUnread && (
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#d97742',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del Dropdown */}
          <div
            style={{
              padding: '0.65rem 1rem',
              borderTop: '1px solid rgba(35, 20, 10, 0.07)',
              backgroundColor: '#fdf7f2',
              textAlign: 'center',
            }}
          >
            <Link
              href="/dashboard/orders"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#d97742',
                textDecoration: 'none',
              }}
            >
              Ir a la bandeja de pedidos <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
