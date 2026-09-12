'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from '@/styles/modules/store.module.scss';
import { getStoreBySlug, getOrderById } from '@/lib/supabase/db';
import { Order, Store } from '@/lib/supabase/types';
import { buildCustomerOrderWhatsAppUrl } from '@/lib/whatsapp';
import { formatCurrency } from '@/lib/utils';
import { Check, MessageCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OrderConfirmationPage() {
  const params = useParams();
  const storeSlug = (params?.storeSlug as string) || '';
  const orderId = (params?.orderId as string) || '';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [s, ord] = await Promise.all([
        getStoreBySlug(storeSlug),
        getOrderById(orderId),
      ]);
      setStore(s);
      setOrder(ord);
      setLoading(false);

      if (ord) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }

    if (storeSlug && orderId) {
      loadData();
    }
  }, [storeSlug, orderId]);

  if (loading || !order || !store) {
    return (
      <div className={styles.storeContainer}>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <p>{loading ? 'Cargando confirmación...' : 'Pedido no encontrado'}</p>
          <Link href={`/${storeSlug}`} className="btn btn--secondary btn--sm" style={{ marginTop: '1rem' }}>
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const whatsappUrl = buildCustomerOrderWhatsAppUrl(store.whatsapp, store.name, order);

  return (
    <div className={styles.storeContainer}>
      <div className={styles.storeContent}>
        <div className={styles.confirmationView}>
          <div className={styles.checkIcon}>
            <Check size={36} />
          </div>

          <h1>¡Pedido recibido!</h1>
          <div className={styles.orderNum}>Pedido #{order.order_number}</div>

          <p>
            Tu pedido #{order.order_number} fue enviado a <strong>{store.name}</strong>.
            <br />
            En breve el vendedor se comunicará contigo por WhatsApp para coordinar tu compra, o puedes
            abrir el chat directamente abajo.
          </p>

          {/* Desglose del pedido */}
          <div className={styles.whatsappCtaBox}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              Resumen de tu compra:
            </div>
            {order.items?.map((item) => (
              <div key={item.id} style={{ marginBottom: '0.35rem' }}>
                • <strong>{item.product_name}</strong> (x{item.quantity}) — {formatCurrency(item.subtotal)}
                {item.variant_data && (
                  <div style={{ fontSize: '0.75rem', color: '#a3a3a3', paddingLeft: '0.75rem' }}>
                    {Object.entries(item.variant_data)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}
                  </div>
                )}
              </div>
            ))}
            <div style={{ borderTop: '1px solid #282828', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 700 }}>
              Total: {formatCurrency(order.total)}
            </div>
            {order.customer_dni && (
              <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.4rem' }}>
                Comprador: {order.customer_name} (DNI: {order.customer_dni})
              </div>
            )}
          </div>

          {/* CTA PRINCIPAL: CONTINUAR POR WHATSAPP (Section 22) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp btn--full btn--lg"
            >
              <MessageCircle size={20} /> Continuar por WhatsApp
            </a>

            <Link href={`/${storeSlug}`} className="btn btn--secondary btn--full">
              <ArrowLeft size={16} /> Volver al catálogo de {store.name}
            </Link>
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
