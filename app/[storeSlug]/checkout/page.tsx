'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import styles from '@/styles/modules/store.module.scss';
import { cartManager, CartItem } from '@/lib/cart';
import { getStoreBySlug, getStoreBilling } from '@/lib/supabase/db';
import { Store, StoreBillingInfo } from '@/lib/supabase/types';
import { trackEvent } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';
import { uploadImage } from '@/lib/supabase/storage';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Smartphone,
  Building2,
  Copy,
  Check,
  Upload,
  ImageIcon,
  X,
  Loader2,
  QrCode,
  MapPin,
  AlertCircle,
  CreditCard,
  FileCheck,
} from 'lucide-react';

const PERU_DEPARTMENTS = [
  "Lima", "Arequipa", "Cusco", "La Libertad", "Piura", "Lambayeque",
  "Áncash", "Junín", "Ica", "San Martín", "Cajamarca", "Loreto",
  "Ayacucho", "Huánuco", "Puno", "Tacna", "Ucayali", "Amazonas",
  "Apurímac", "Callao", "Huancavelica", "Madre de Dios", "Moquegua",
  "Pasco", "Tumbes"
];

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard?.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || '';

  const [items, setItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [billing, setBilling] = useState<StoreBillingInfo>({ bank_accounts: [], digital_wallets: [] });

  // Form fields
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [department, setDepartment] = useState('Lima');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<string>(''); // 'wallet-{id}' or 'bank-{id}'

  // Voucher upload
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [isUploadingVoucher, setIsUploadingVoucher] = useState(false);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const voucherInputRef = useRef<HTMLInputElement>(null);

  // Copy feedback per field
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadStore() {
      const s = await getStoreBySlug(storeSlug);
      setStore(s);

      const cart = cartManager.getItems(storeSlug);
      setItems(cart);

      if (s) {
        const b = await getStoreBilling(s.id);
        setBilling(b);

        // Pre-select first available payment method
        if (b.digital_wallets && b.digital_wallets.length > 0) {
          setPaymentMethod(`wallet-${b.digital_wallets[0].id}`);
        } else if (b.bank_accounts && b.bank_accounts.length > 0) {
          setPaymentMethod(`bank-${b.bank_accounts[0].id}`);
        } else {
          setPaymentMethod('default-wallet');
        }

        if (cart.length > 0) {
          trackEvent({
            storeId: s.id,
            eventType: 'checkout_started',
            metadata: { itemsCount: cart.length },
          });
        }
      }
    }

    if (storeSlug) loadStore();
  }, [storeSlug]);

  const subtotal = cartManager.getSubtotal(items);

  // Digital wallets and bank accounts configured by store
  const wallets = billing.digital_wallets || [];
  const banks = billing.bank_accounts || [];
  const hasConfiguredPaymentMethods = wallets.length > 0 || banks.length > 0;

  const handleVoucherChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      setError('Por favor sube una imagen de tu comprobante (JPG, PNG, WEBP).');
      return;
    }

    setVoucherFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVoucherPreview(objectUrl);
    setIsUploadingVoucher(true);
    setError('');

    try {
      // Subida confiable mediante endpoint server-side con credenciales
      const uploadedUrl = await uploadImage(file, 'stores');
      setVoucherUrl(uploadedUrl);
    } catch (err: any) {
      console.warn('API upload fallback to local data-url:', err);
      // Fallback a Data URL para que el cliente nunca quede bloqueado
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setVoucherUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingVoucher(false);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!store) {
      setError('Tienda no encontrada.');
      return;
    }
    if (!name.trim() || !dni.trim() || !whatsapp.trim()) {
      setError('Por favor ingresa tu nombre completo, DNI y número de WhatsApp.');
      return;
    }
    if (dni.trim().length < 8) {
      setError('Por favor ingresa un número de DNI válido de 8 dígitos.');
      return;
    }
    if (!department.trim() || !province.trim() || !city.trim() || !address.trim()) {
      setError('Por favor completa departamento, provincia, ciudad/distrito y dirección de entrega.');
      return;
    }
    if (items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    // Validación de stock de cada producto en el carrito
    for (const item of items) {
      if (item.stock !== null && item.stock !== undefined) {
        if (item.stock <= 0) {
          setError(`El producto "${item.name}" ya se encuentra agotado.`);
          return;
        }
        if (item.quantity > item.stock) {
          setError(
            `El producto "${item.name}" solo cuenta con ${item.stock} unidad(es) disponibles y tienes ${item.quantity} en el carrito. Ajusta tu pedido para continuar.`
          );
          return;
        }
      }
    }

    // Validación obligatoria de comprobante de pago
    if (!voucherUrl) {
      setError('⚠️ Es obligatorio realizar el pago y adjuntar tu comprobante antes de generar el pedido.');
      const elem = document.getElementById('voucher-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddress = `${address.trim()}, ${city.trim()}, ${province.trim()}, ${department.trim()}`;

      // Nombre legible del método de pago
      let methodLabel = paymentMethod;
      if (paymentMethod.startsWith('wallet-')) {
        const w = wallets.find((wal) => `wallet-${wal.id}` === paymentMethod || wal.id === paymentMethod);
        if (w) methodLabel = `${w.platform} (${w.phone} - ${w.holder_name})`;
      } else if (paymentMethod.startsWith('bank-')) {
        const b = banks.find((bnk) => `bank-${bnk.id}` === paymentMethod);
        if (b) methodLabel = `${b.bank} (${b.account_number})`;
      } else if (paymentMethod === 'default-wallet') {
        methodLabel = `Yape/Plin (${store.whatsapp})`;
      }

      const orderPayload = {
        storeId: store.id,
        customerName: name.trim(),
        customerDni: dni.trim(),
        customerPhone: whatsapp.trim(),
        customerAddress: fullAddress,
        customerReference: reference.trim() || undefined,
        voucherUrl: voucherUrl || undefined,
        paymentMethod: methodLabel,
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

      // Notificación instantánea multiplataforma al negocio (0ms)
      try {
        if (typeof window !== 'undefined') {
          // 1. Canal BroadcastChannel (para pestañas en el mismo navegador)
          const bc = new BroadcastChannel('klik_orders');
          bc.postMessage({
            type: 'NEW_ORDER',
            order: data.order,
            storeId: store.id,
          });
          setTimeout(() => bc.close(), 1000);

          // 2. LocalStorage storage event (para cualquier pestaña secundaria)
          localStorage.setItem(
            'klik_latest_order_event',
            JSON.stringify({
              orderId: data.order.id,
              orderNumber: data.order.order_number,
              customerName: data.order.customer_name,
              total: data.order.total,
              storeId: store.id,
              t: Date.now(),
            })
          );
        }
      } catch (bcErr) {
        console.warn('Instant broadcast error:', bcErr);
      }

      trackEvent({
        storeId: store.id,
        eventType: 'order_created',
        orderId: data.order.id,
        metadata: { total: data.order.total, orderNumber: data.order.order_number },
      });

      cartManager.clearCart(storeSlug);
      router.push(`/${storeSlug}/order-confirmation/${data.order.id}`);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar el pedido. Intenta nuevamente.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.storeContainer}>
        <div className={styles.storeContent}>
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
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
          <Link href={`/${storeSlug}/cart`} className="btn btn--ghost btn--sm" style={{ paddingLeft: '10px' }}>
            <ArrowLeft size={16} /> Volver al carrito
          </Link>
        </div>

        <div className={styles.checkoutView}>
          <div className={styles.checkoutView__header}>
            <h1>Finalizar Pedido</h1>
            <p>Sigue los 3 pasos: completa tus datos, realiza el pago y adjunta tu comprobante.</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Resumen del pedido */}
          <div style={{
            backgroundColor: 'var(--color-surface-alt)',
            border: '1px solid var(--color-hairline)',
            borderRadius: '14px',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.75rem',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-mid-gray)', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.04em' }}>
              Resumen del pedido ({items.length} artículo{items.length > 1 ? 's' : ''})
            </div>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                <span>{item.name} <span style={{ color: 'var(--color-mid-gray)' }}>x{item.quantity}</span></span>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-hairline)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem' }}>
              <span>Total a pagar</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <form onSubmit={handleConfirmOrder}>
            {/* ── PASO 1: DATOS DE CONTACTO Y ENTREGA ── */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  1
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                  Tus datos de entrega
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.75rem 0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-name">Nombre y apellido *</label>
                  <input
                    id="checkout-name"
                    type="text"
                    className="input"
                    placeholder="Ej. Carlos Mendoza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-dni">DNI *</label>
                  <input
                    id="checkout-dni"
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
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-phone">Número de teléfono *</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    className="input"
                    placeholder="Ej. 987654321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />
                </div>
                {/* Departamento, Provincia y Ciudad */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-dept">Departamento *</label>
                  <select
                    id="checkout-dept"
                    className="input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    {PERU_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-province">Provincia *</label>
                  <input
                    id="checkout-province"
                    type="text"
                    className="input"
                    placeholder="Ej. Lima, Trujillo, Arequipa..."
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-city">Ciudad o Distrito *</label>
                  <input
                    id="checkout-city"
                    type="text"
                    className="input"
                    placeholder="Ej. Miraflores, Yanahuara..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-address">Dirección exacta de entrega *</label>
                  <input
                    id="checkout-address"
                    type="text"
                    className="input"
                    placeholder="Ej. Av. Larco 450, Dpto 301"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="checkout-ref">Referencia (opcional)</label>
                  <input
                    id="checkout-ref"
                    type="text"
                    className="input"
                    placeholder="Ej. Frente al parque Kennedy"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── PASO 2: REALIZAR EL PAGO (MÉTODOS Y QRS) ── */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  2
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                  Realiza el pago
                </h3>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)', marginBottom: '1rem' }}>
                Transfiere el monto exacto de <strong>{formatCurrency(subtotal)}</strong> a cualquiera de las siguientes opciones oficiales:
              </p>

              {/* Billeteras Digitales: Yape y Plin */}
              {wallets.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-mid-gray)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                    Billeteras Digitales (Yape / Plin)
                  </div>
                  {wallets.map((wallet) => {
                    const isSelected = paymentMethod === `wallet-${wallet.id}` || (wallets.length === 1 && !paymentMethod.startsWith('bank-'));
                    return (
                      <div
                        key={wallet.id}
                        onClick={() => setPaymentMethod(`wallet-${wallet.id}`)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                          borderRadius: '14px',
                          padding: '1rem 1.25rem',
                          marginBottom: '0.75rem',
                          backgroundColor: isSelected ? 'rgba(217, 119, 66, 0.04)' : 'var(--color-paper)',
                          boxShadow: isSelected ? '0 4px 12px rgba(217, 119, 66, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSelected ? '0.75rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {wallet.platform === 'Yape' && (
                              <img
                                src="/icons/yape.png"
                                alt="Yape"
                                width={38}
                                height={38}
                              />
                            )}

                            {wallet.platform === 'Plin' && (
                              <img
                                src="/icons/plin.png"
                                alt="Plin"
                                width={38}
                                height={38}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ink)' }}>
                                {wallet.platform}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                                Titular: <strong>{wallet.holder_name}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                            background: isSelected ? 'var(--color-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-hairline)' }}>
                            {/* Número y botón copiar */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: 'var(--color-surface-alt)',
                              padding: '0.6rem 0.85rem',
                              borderRadius: '10px',
                              marginBottom: wallet.qr_url ? '1rem' : '0',
                            }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', display: 'block' }}>Número para pagar:</span>
                                <strong style={{ fontSize: '1.0625rem', color: 'var(--color-ink)', letterSpacing: '0.02em' }}>{wallet.phone}</strong>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(wallet.phone, (v) => setCopied((prev) => ({ ...prev, [`phone-${wallet.id}`]: v })));
                                }}
                                className="btn btn--secondary btn--sm"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                {copied[`phone-${wallet.id}`] ? (
                                  <><Check size={13} style={{ color: '#16a34a' }} /> ¡Copiado!</>
                                ) : (
                                  <><Copy size={13} /> Copiar número</>
                                )}
                              </button>
                            </div>

                            {/* Imagen de Código QR */}
                            {wallet.qr_url && (
                              <div style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid var(--color-hairline)',
                                borderRadius: '12px',
                                padding: '1.1rem',
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                              }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                  <QrCode size={15} style={{ color: 'var(--color-primary)' }} /> Escanea o guarda el QR para pagar:
                                </div>
                                <img
                                  src={wallet.qr_url}
                                  alt={`Código QR ${wallet.platform}`}
                                  style={{
                                    width: '190px',
                                    height: '190px',
                                    objectFit: 'contain',
                                    borderRadius: '10px',
                                    margin: '0 auto',
                                    display: 'block',
                                    border: '1px solid var(--color-hairline)',
                                    padding: '4px',
                                    backgroundColor: '#fff',
                                  }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', marginTop: '0.5rem' }}>
                                  {wallet.platform} · {wallet.holder_name} ({wallet.phone})
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cuentas Bancarias */}
              {banks.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-mid-gray)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                    Transferencia Bancaria
                  </div>
                  {banks.map((bank) => {
                    const isSelected = paymentMethod === `bank-${bank.id}`;
                    return (
                      <div
                        key={bank.id}
                        onClick={() => setPaymentMethod(`bank-${bank.id}`)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                          borderRadius: '14px',
                          padding: '1rem 1.25rem',
                          marginBottom: '0.75rem',
                          backgroundColor: isSelected ? 'rgba(217, 119, 66, 0.04)' : 'var(--color-paper)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSelected ? '0.75rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              <Building2 size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ink)' }}>
                                {bank.bank} ({bank.account_type})
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                                Titular: <strong>{bank.holder_name}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                            background: isSelected ? 'var(--color-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-hairline)', display: 'grid', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-alt)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-mid-gray)', display: 'block' }}>N° de Cuenta:</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{bank.account_number}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(bank.account_number, (v) => setCopied((p) => ({ ...p, [`acc-${bank.id}`]: v })));
                                }}
                                className="btn btn--secondary btn--sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                {copied[`acc-${bank.id}`] ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
                              </button>
                            </div>

                            {bank.cci && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-alt)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                                <div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--color-mid-gray)', display: 'block' }}>Código Interbancario (CCI):</span>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{bank.cci}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(bank.cci, (v) => setCopied((p) => ({ ...p, [`cci-${bank.id}`]: v })));
                                  }}
                                  className="btn btn--secondary btn--sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  {copied[`cci-${bank.id}`] ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Si la tienda no tiene ningún método configurado */}
              {!hasConfiguredPaymentMethods && store && (
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '14px',
                  marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ink)', marginBottom: '0.35rem' }}>
                    <Smartphone size={18} style={{ color: 'var(--color-primary)' }} /> Coordinación directa con la tienda
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)', margin: '0 0 0.75rem 0' }}>
                    La tienda aún no ha publicado sus cuentas. Puedes coordinar tu pago por WhatsApp al siguiente número:
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-paper)', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid var(--color-hairline)' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-mid-gray)', display: 'block' }}>WhatsApp de contacto:</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-ink)' }}>{store.whatsapp}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(store.whatsapp, (v) => setCopied((p) => ({ ...p, 'store-wa': v })))}
                      className="btn btn--secondary btn--sm"
                    >
                      {copied['store-wa'] ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── PASO 3: ADJUNTAR COMPROBANTE DE PAGO (OBLIGATORIO) ── */}
            <div id="voucher-section" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  3
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                  Envío de comprobante de pago *
                </h3>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)', marginBottom: '1rem' }}>
                Adjunta la captura de pantalla o foto del comprobante de transferencia o Yape/Plin. Es obligatorio para que el negocio procese tu orden.
              </p>

              <div id="voucher-upload-card" style={{
                border: `2px dashed ${voucherUrl ? '#16a34a' : 'var(--color-hairline)'}`,
                borderRadius: '14px',
                padding: '1.25rem',
                backgroundColor: voucherUrl ? 'rgba(22, 163, 74, 0.04)' : 'var(--color-surface-alt)',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}>
                {!voucherPreview ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => voucherInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '1rem 0',
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', color: 'var(--color-primary)' }}>
                        <Upload size={22} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-ink)' }}>
                        Haz clic aquí para subir tu comprobante de pago
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)' }}>
                        Acepta fotos y capturas (JPG, PNG, WEBP)
                      </span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {isUploadingVoucher ? (
                      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-mid-gray)' }}>
                        <Loader2 size={20} className="spin" />
                        <span>Subiendo comprobante...</span>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={voucherPreview}
                          alt="Comprobante de pago"
                          style={{
                            maxWidth: '220px',
                            maxHeight: '220px',
                            objectFit: 'contain',
                            borderRadius: '10px',
                            border: '1px solid var(--color-hairline)',
                            display: 'block',
                            margin: '0 auto',
                            backgroundColor: '#fff',
                          }}
                        />
                        {voucherUrl && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.65rem',
                            color: '#16a34a',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            backgroundColor: 'rgba(22, 163, 74, 0.1)',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '8px',
                          }}>
                            <Check size={14} /> Comprobante adjuntado correctamente
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setVoucherFile(null);
                            setVoucherPreview(null);
                            setVoucherUrl(null);
                          }}
                          style={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          }}
                          title="Eliminar y subir otro comprobante"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={voucherInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleVoucherChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-mid-gray)', marginBottom: '0.5rem' }}>
              <Lock size={14} /> Tu compra es directa con el negocio. Sin intermediarios ni comisiones.
            </div>

            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Al confirmar tu pedido, aceptas los{' '}
              <Link href="/terminos" target="_blank" style={{ color: '#bbb', textDecoration: 'underline' }}>
                Términos de servicio
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" target="_blank" style={{ color: '#bbb', textDecoration: 'underline' }}>
                Política de Privacidad
              </Link>{' '}
              de la plataforma.
            </div>

            {/* BOTÓN DE CONFIRMAR PEDIDO */}
            <button
              type="submit"
              className="btn btn--primary btn--full btn--lg"
              disabled={isSubmitting || isUploadingVoucher}
              style={{
                backgroundColor: !voucherUrl ? 'var(--color-ink)' : undefined,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="spin" /> Generando pedido...</>
              ) : !voucherUrl ? (
                <>Adjunta tu comprobante para confirmar <Upload size={16} style={{ marginLeft: '0.4rem' }} /></>
              ) : (
                <>Confirmar y enviar pedido <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.75rem', color: '#737373', borderTop: '1px solid var(--color-hairline)', marginTop: '2rem' }}>
        <div>
          Creado con{' '}
          <Link href="/" style={{ color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none' }}>Klik<span>.</span></Link>{' '}
          — Catálogo online para WhatsApp
        </div>
        <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#666' }}>
          Desarrollado por{' '}
          <a href="https://kubostudio.co" target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', fontWeight: 600, textDecoration: 'none' }}>KUBOstudio</a>
        </div>
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem' }}>
          <Link href="/terminos" target="_blank" style={{ color: '#888', textDecoration: 'none' }}>Términos</Link>
          <Link href="/privacidad" target="_blank" style={{ color: '#888', textDecoration: 'none' }}>Privacidad</Link>
          <Link href="/cookies" target="_blank" style={{ color: '#888', textDecoration: 'none' }}>Cookies</Link>
          <Link href="/reclamaciones" target="_blank" style={{ color: '#888', textDecoration: 'none' }}>Libro de Reclamaciones</Link>
        </div>
      </footer>
    </div>
  );
}
