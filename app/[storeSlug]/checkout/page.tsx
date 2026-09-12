'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/modules/store.module.scss';
import { cartManager, CartItem } from '@/lib/cart';
import { getStoreBySlug } from '@/lib/supabase/db';
import { Store } from '@/lib/supabase/types';
import { trackEvent } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || '';

  const [items, setItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  // Form fields (Section 20)
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStore() {
      const s = await getStoreBySlug(storeSlug);
      setStore(s);

      const cart = cartManager.getItems(storeSlug);
      setItems(cart);

      if (s && cart.length > 0) {
        trackEvent({
          storeId: s.id,
          eventType: 'checkout_started',
          metadata: { itemsCount: cart.length },
        });
      }
    }

    if (storeSlug) {
      loadStore();
    }
  }, [storeSlug]);

  const subtotal = cartManager.getSubtotal(items);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!store) {
      setError('Tienda no encontrada.');
      return;
    }

    if (!name.trim() || !dni.trim() || !whatsapp.trim()) {
      setError('Por favor ingresa tu nombre, DNI y número de WhatsApp.');
      return;
    }

    if (dni.trim().length < 8) {
      setError('Por favor ingresa un número de DNI válido (8 dígitos).');
      return;
    }

    if (items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Llamar a API route para procesamiento server-side en Supabase
      const orderPayload = {
        storeId: store.id,
        customerName: name.trim(),
        customerDni: dni.trim(),
        customerPhone: whatsapp.trim(),
        customerAddress: address.trim() || undefined,
        customerReference: reference.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variantData: i.variants,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.order) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      const createdOrder = data.order;

      // 2. Registrar analítica
      trackEvent({
        storeId: store.id,
        eventType: 'order_created',
        orderId: createdOrder.id,
        metadata: {
          total: createdOrder.total,
          orderNumber: createdOrder.order_number,
        },
      });

      // 3. Limpiar carrito
      cartManager.clearCart(storeSlug);

      // 4. Redirigir a confirmación
      router.push(`/${storeSlug}/order-confirmation/${createdOrder.id}`);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar el pedido. Intenta nuevamente.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.storeContainer}>
        <div className={styles.storeContent}>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h2>Tu carrito está vacío</h2>
            <Link href={`/${storeSlug}`} className="btn btn--primary btn--sm" style={{ marginTop: '1rem' }}>
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.storeContainer}>
      <div className={styles.storeContent}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href={`/${storeSlug}/cart`} className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Volver al carrito
          </Link>
        </div>

        <div className={styles.checkoutView}>
          <div className={styles.checkoutView__header}>
            <h1>Finalizar Pedido</h1>
            <p>Ingresa tus datos para coordinar la entrega y el pago por WhatsApp.</p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Resumen compacto del pedido */}
          <div
            style={{
              backgroundColor: '#191919',
              border: '1px solid #282828',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Resumen ({items.length} producto{items.length > 1 ? 's' : ''})
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span>
                  {item.name} <span style={{ color: '#a3a3a3' }}>x{item.quantity}</span>
                </span>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div
              style={{
                borderTop: '1px solid #282828',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '0.9375rem',
              }}
            >
              <span>Total a pagar</span>
              <span style={{ color: '#ffffff' }}>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <form onSubmit={handleConfirmOrder}>
            <div className="form-group">
              <label htmlFor="name">Tu nombre y apellido *</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Ej. Carlos Mendoza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dni">DNI / Documento de identidad *</label>
              <input
                id="dni"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                className="input"
                placeholder="Ej. 72345678"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
              />
              <span className="helper-text">
                Requerido para la emisión del comprobante y registro de compra.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">Tu número de WhatsApp *</label>
              <input
                id="whatsapp"
                type="tel"
                className="input"
                placeholder="Ej. 987654321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
              <span className="helper-text">
                El vendedor se comunicará a este WhatsApp para confirmar el pago y el envío.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="address">Dirección de entrega (opcional)</label>
              <input
                id="address"
                type="text"
                className="input"
                placeholder="Ej. Av. Larco 450 Dpto 402, Miraflores"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reference">Referencia de ubicación (opcional)</label>
              <input
                id="reference"
                type="text"
                className="input"
                placeholder="Ej. Frente al parque, timbre 402"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                color: '#a3a3a3',
                margin: '1rem 0',
              }}
            >
              <Lock size={14} /> No requieres cuenta para comprar. Tus datos están seguros.
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full btn--lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generando pedido...' : 'Confirmar pedido'}{' '}
              <ArrowRight size={18} />
            </button>
          </form>
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
