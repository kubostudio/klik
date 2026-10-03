'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/db';
import { useDashboard } from '@/contexts/DashboardContext';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, X, Bell, ArrowRight, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface NotifiedOrder {
  id: string;
  order_number?: number | string;
  customer_name: string;
  total: number;
  payment_method?: string | null;
  created_at?: string;
}

// Ruta del archivo de audio personalizado en la carpeta public:
// Rutas de audio personalizadas soportadas en public/sounds/:
const AUDIO_SOURCES = [
  '/sounds/order-notification.m4a',
  '/sounds/order-notification.mp3',
  '/sounds/order-notification.wav',
  '/sounds/order-notification.ogg',
];

export default function InstantOrderNotifier() {
  const { store } = useDashboard();
  const [activeAlert, setActiveAlert] = useState<NotifiedOrder | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Tono sintetizado armónico de respaldo con Web Audio API (agradable y nítido)
  const playSynthesizedChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = audioCtxRef.current || new AudioContextClass();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Progresión armónica de venta: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const pitches = [523.25, 659.25, 783.99, 1046.5];
      const startTime = ctx.currentTime;

      pitches.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + index * 0.08);

        gain.gain.setValueAtTime(0, startTime + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.35, startTime + index * 0.08 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.08 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + index * 0.08);
        osc.stop(startTime + index * 0.08 + 0.35);
      });
    } catch (err) {
      console.warn('Web Audio synthesis error:', err);
    }
  }, []);

  // Reproducción de sonido: intenta archivo de audio personalizado (.m4a, .mp3, .wav), si no existe usa Web Audio
  const playSaleChime = useCallback(() => {
    if (soundMuted) return;

    let played = false;
    const tryPlaySource = (index: number) => {
      if (index >= AUDIO_SOURCES.length) {
        if (!played) playSynthesizedChime();
        return;
      }
      try {
        const audio = new Audio(AUDIO_SOURCES[index]);
        audio.volume = 0.95;
        const promise = audio.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              played = true;
            })
            .catch(() => {
              tryPlaySource(index + 1);
            });
        } else {
          tryPlaySource(index + 1);
        }
      } catch {
        tryPlaySource(index + 1);
      }
    };

    tryPlaySource(0);
  }, [soundMuted, playSynthesizedChime]);

  // Manejar recepción de nueva orden
  const handleIncomingOrder = useCallback(
    (order: NotifiedOrder) => {
      if (!order || !order.id) return;

      // Evitar alertas duplicadas
      if (notifiedIdsRef.current.has(order.id)) return;
      notifiedIdsRef.current.add(order.id);

      if (notifiedIdsRef.current.size > 200) {
        const first = notifiedIdsRef.current.values().next().value;
        if (first) notifiedIdsRef.current.delete(first);
      }

      // Sonido y vibración
      playSaleChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([160, 90, 160]);
        } catch {}
      }

      // Notificación nativa del sistema operativo / navegador
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('¡Nuevo pedido recibido en Klik!', {
            body: `${order.customer_name} acaba de comprar por ${formatCurrency(order.total)}.`,
            icon: '/icon-192.png',
          });
        } catch {}
      }

      // Mostrar toast en pantalla (permanece visible hasta que el usuario hace clic en la X)
      setActiveAlert(order);

      // Notificar a componentes locales (ej. NotificationBell y bandeja de pedidos)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('klik-order-received', { detail: order })
        );
      }
    },
    [playSaleChime]
  );

  // Solicitar permiso de notificaciones push del navegador
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Suscripciones: Supabase Realtime + BroadcastChannel + LocalStorage
  useEffect(() => {
    if (!store?.id) return;

    // 1. Supabase Realtime con canal único
    const channelName = `realtime-orders-${store.id}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${store.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            handleIncomingOrder(payload.new as NotifiedOrder);
          }
        }
      )
      .subscribe();

    // 2. BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('klik_orders');
        bc.onmessage = (event) => {
          if (
            event.data?.type === 'NEW_ORDER' &&
            (!event.data.storeId || event.data.storeId === store.id)
          ) {
            handleIncomingOrder(event.data.order);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // 3. Storage Event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'klik_latest_order_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.storeId === store.id && parsed.orderId) {
            handleIncomingOrder({
              id: parsed.orderId,
              order_number: parsed.orderNumber,
              customer_name: parsed.customerName || 'Cliente',
              total: parsed.total || 0,
            });
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [store?.id, handleIncomingOrder]);

  if (!activeAlert) return null;

  return (
    <aside
      role="alert"
      aria-live="assertive"
      aria-label="Nuevo pedido recibido"
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 99999,
        maxWidth: '380px',
        width: 'calc(100vw - 2.5rem)',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(217, 119, 66, 0.28)',
        borderRadius: '16px',
        boxShadow:
          '0 20px 45px -8px rgba(35, 15, 5, 0.16), 0 6px 18px rgba(35, 15, 5, 0.08), 0 0 0 1px rgba(217, 119, 66, 0.08)',
        padding: '1.15rem 1.25rem',
        color: '#232323',
        fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        animation: 'klikToastEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes klikToastEnter {
          0% { transform: translateY(-20px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes klikBellSwing {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(4deg); }
          100% { transform: rotate(0deg); }
        }
        .klik-action-btn:hover {
          background-color: #c4662f !important;
        }
      `}</style>

      {/* Cabecera del Toast */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(217, 119, 66, 0.1)',
              color: '#d97742',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
              border: '1px solid rgba(217, 119, 66, 0.2)',
            }}
          >
          Nuevo Pedido
          </span>
          {activeAlert.order_number && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(35, 35, 35, 0.5)', fontWeight: 500 }}>
              #{activeAlert.order_number}
            </span>
          )}
        </div>

        {/* Controles de sonido y cierre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            aria-label="Cerrar notificación"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(35, 35, 35, 0.45)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Cuerpo del Toast */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.9rem' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'rgba(217, 119, 66, 0.1)',
            border: '1px solid rgba(217, 119, 66, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97742',
            flexShrink: 0,
            animation: 'klikBellSwing 1.8s ease-in-out infinite',
          }}
        >
          <Bell size={20} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#232323',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeAlert.customer_name}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.45rem',
              marginTop: '0.15rem',
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#d97742',
                letterSpacing: '-0.02em',
              }}
            >
              {formatCurrency(activeAlert.total)}
            </span>
            {activeAlert.payment_method && (
              <span
                style={{
                  fontSize: '0.725rem',
                  color: 'rgba(35, 35, 35, 0.55)',
                  backgroundColor: 'rgba(35, 20, 10, 0.05)',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '120px',
                }}
              >
                {activeAlert.payment_method}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botón de acción con estilo nativo Klik */}
      <Link
        href="/dashboard/orders"
        onClick={() => setActiveAlert(null)}
        className="klik-action-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          width: '100%',
          backgroundColor: '#d97742',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.85rem',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(217, 119, 66, 0.25)',
          transition: 'background-color 0.15s ease, transform 0.1s ease',
        }}
      >
        <ShoppingBag size={15} /> Ver Pedido en Bandeja <ArrowRight size={14} />
      </Link>
    </aside>
  );
}
