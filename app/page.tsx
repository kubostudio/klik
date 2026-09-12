'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/modules/landing.module.scss';
import {
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  Check,
  Store,
  ShoppingCart,
  ClipboardList,
  Users,
  BarChart3,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'store' | 'whatsapp'>('orders');

  return (
    <div className={styles.page}>
      {/* 1. HEADER */}
      <header className={styles.header}>
        <div className={styles.header__inner}>
          <Link href="/" className={styles.header__logo} style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size={48} color="#ffffff" />
          </Link>

          <nav className={styles.header__nav}>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <Link href="#pricing">Planes</Link>
          </nav>

          <div className={styles.header__actions}>
            <Link href="/login" className="btn btn--ghost btn--sm">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn btn--primary btn--sm">
              Crear mi tienda
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.hero__inner}>
          <h1 className={styles.hero__title}>
            Tu tienda online. Tus pedidos organizados.{' '}
            <span className={styles.accent}>Tu WhatsApp.</span>
          </h1>

          <p className={styles.hero__subtitle}>
            Crea tu catálogo digital en minutos, comparte un solo link en tus redes y recibe compras
            estructuradas directamente en WhatsApp con panel operativo en tiempo real.
          </p>

          <div className={styles.hero__ctas}>
            <Link href="/register" className="btn btn--primary btn--lg">
              Crear mi tienda gratis <ArrowRight size={18} />
            </Link>
            <a href="#como-funciona" className="btn btn--secondary btn--lg">
              Ver cómo funciona
            </a>
          </div>

          {/* 3. PRODUCT SHOWCASE INTERACTIVO */}
          <div className={styles.showcaseWindow}>
            {/* Window Bar with Controls & Tab Switcher */}
            <div className={styles.showcaseWindow__bar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.showcaseWindow__controls}>
                  <div className={styles.showcaseWindow__dot} />
                  <div className={styles.showcaseWindow__dot} />
                  <div className={styles.showcaseWindow__dot} />
                </div>
                <div className={styles.showcaseWindow__urlPill}>
                  <Lock size={11} /> qori.business/mi-tienda
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className={styles.showcaseWindow__tabs}>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`${styles.showcaseWindow__tabBtn} ${
                    activeTab === 'orders' ? styles['showcaseWindow__tabBtn--active'] : ''
                  }`}
                >
                  <ClipboardList size={13} /> Panel de Pedidos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className={`${styles.showcaseWindow__tabBtn} ${
                    activeTab === 'store' ? styles['showcaseWindow__tabBtn--active'] : ''
                  }`}
                >
                  <Store size={13} /> Mi Tienda
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('whatsapp')}
                  className={`${styles.showcaseWindow__tabBtn} ${
                    activeTab === 'whatsapp' ? styles['showcaseWindow__tabBtn--active'] : ''
                  }`}
                >
                  <MessageCircle size={13} /> Cierre en WhatsApp
                </button>
              </div>
            </div>

            {/* Window Content Display */}
            <div className={styles.showcaseWindow__content}>
              {/* TAB 1: PANEL DE PEDIDOS (DASHBOARD REAL) */}
              {activeTab === 'orders' && (
                <div className={styles.mockOrders}>
                  <div className={styles.mockOrders__metrics}>
                    <div className={styles.mockOrders__metricCard}>
                      <div className={styles.metricLabel}>Pedidos del día</div>
                      <div className={styles.metricValue}>24</div>
                    </div>
                    <div className={styles.mockOrders__metricCard}>
                      <div className={styles.metricLabel}>Ventas del mes</div>
                      <div className={styles.metricValue}>S/ 1,890.00</div>
                    </div>
                    <div className={styles.mockOrders__metricCard}>
                      <div className={styles.metricLabel}>Clientes activos</div>
                      <div className={styles.metricValue}>38</div>
                    </div>
                  </div>

                  <div className={styles.mockOrders__tableWrapper}>
                    <table className={styles.mockOrders__table}>
                      <thead>
                        <tr>
                          <th>Nº</th>
                          <th>Cliente</th>
                          <th>Productos</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>#1042</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>Carlos Mendoza</div>
                            <div style={{ fontSize: '11px', color: '#737373' }}>
                              DNI: 72345678 • 987654321
                            </div>
                          </td>
                          <td>Polo Heavyweight (x1)</td>
                          <td style={{ fontWeight: 600 }}>S/ 89.00</td>
                          <td>
                            <span className="badge badge--new">Nuevo</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              className="btn btn--secondary btn--sm"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                              <MessageCircle size={12} /> Coordinar
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>#1041</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>Andrea Rojas</div>
                            <div style={{ fontSize: '11px', color: '#737373' }}>
                              DNI: 45892103 • 912345678
                            </div>
                          </td>
                          <td>Tote Bag Canvas (x2)</td>
                          <td style={{ fontWeight: 600 }}>S/ 110.00</td>
                          <td>
                            <span className="badge badge--contacted">Contactado</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              className="btn btn--secondary btn--sm"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                              <Check size={12} /> Confirmar
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>#1040</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>Mateo Silva</div>
                            <div style={{ fontSize: '11px', color: '#737373' }}>
                              DNI: 71204938 • 955432111
                            </div>
                          </td>
                          <td>Gorra Minimal (x1)</td>
                          <td style={{ fontWeight: 600 }}>S/ 45.00</td>
                          <td>
                            <span className="badge badge--confirmed">Confirmado</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#737373', fontWeight: 500 }}>
                              En despacho
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>#1039</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>Lucía Vargas</div>
                            <div style={{ fontSize: '11px', color: '#737373' }}>
                              DNI: 10482910 • 934567890
                            </div>
                          </td>
                          <td>Hoodie Boxy Fit (x1)</td>
                          <td style={{ fontWeight: 600 }}>S/ 140.00</td>
                          <td>
                            <span className="badge badge--delivered">Entregado</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#737373', fontWeight: 500 }}>
                              Finalizado
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: TIENDA DEL COMPRADOR (MÓVIL / STOREFRONT) */}
              {activeTab === 'store' && (
                <div className={styles.mockStorefront}>
                  <div className={styles.mockStorefront__header}>
                    <div className={styles.storeAvatar}>AS</div>
                    <h3>Mi Tienda</h3>
                    <p>Moda urbana & esenciales de diseño. Envíos a todo el Perú 🇵🇪</p>
                  </div>

                  <div className={styles.mockStorefront__productCard}>
                    <div className={styles.productThumb}>
                      <ShoppingBag size={28} />
                    </div>
                    <div className={styles.productDetails}>
                      <h4>Polo Oversize Heavyweight</h4>
                      <div className={styles.productPrice}>
                        S/ 89.00
                      </div>
                      <div className={styles.variantTags}>
                        <span>Color: Negro</span>
                        <span>Talla: L</span>
                        <span>En stock</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.mockStorefront__cartBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShoppingCart size={16} />
                      <span>1 producto • S/ 89.00</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      Pedir por WhatsApp <ArrowRight size={14} />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '12px',
                      fontSize: '11px',
                      color: '#737373',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={13} /> Sin crear contraseñas. Solo nombre, DNI y WhatsApp.
                  </div>
                </div>
              )}

              {/* TAB 3: CIERRE EN WHATSAPP (CHAT SIMULADO) */}
              {activeTab === 'whatsapp' && (
                <div className={styles.mockWhatsApp}>
                  <div className={styles.mockWhatsApp__top}>
                    <div className={styles.avatar}>AS</div>
                    <div className={styles.info}>
                      <h4>Mi Tienda (Ventas)</h4>
                      <span>● En línea</span>
                    </div>
                  </div>

                  <div className={styles.mockWhatsApp__body}>
                    <div className={styles.mockWhatsApp__bubbleCustomer}>
                      <div>
                        Hola, hice el pedido <strong>#1042</strong> en Qori para{' '}
                        <strong>Mi Tienda</strong>.
                      </div>
                      <div style={{ marginTop: '4px', fontWeight: 600 }}>Mi pedido:</div>
                      <div className={styles.orderItem}>
                        • <strong>Polo Oversize Heavyweight</strong> (x1) - S/ 89.00
                        <div style={{ fontSize: '11px', color: '#8696a0' }}>
                          _Color: Negro, Talla: L_
                        </div>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <strong>Total:</strong> S/ 89.00
                      </div>
                      <div>
                        <strong>Cliente:</strong> Carlos Mendoza
                      </div>
                      <div>
                        <strong>DNI:</strong> 72345678
                      </div>
                      <div>
                        <strong>WhatsApp:</strong> 987654321
                      </div>
                      <div>
                        <strong>Dirección:</strong> Av. Benavides 1420 Dpto 302, Miraflores
                      </div>
                      <div style={{ marginTop: '6px', fontWeight: 500 }}>
                        Quiero confirmar mi compra.
                      </div>
                    </div>

                    <div className={styles.mockWhatsApp__bubbleSeller}>
                      <div>¡Hola Carlos! 🙌 Recibimos tu pedido #1042 en Mi Tienda.</div>
                      <div style={{ marginTop: '4px' }}>
                        Lo tenemos listo para despacho hoy mismo. ¿Deseas coordinar el pago por{' '}
                        <strong>Yape</strong> o <strong>transferencia BCP</strong>?
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST METRICS STRIP */}
      <section className={styles.trustStrip}>
        <div className={styles.trustStrip__inner}>
          <div className={styles.trustStrip__item}>
            <div className={styles.metricNumber}>0%</div>
            <div className={styles.metricLabel}>
              Comisión por venta (Tu dinero 100% tuyo)
            </div>
          </div>
          <div className={styles.trustStrip__item}>
            <div className={styles.metricNumber}>+5,000</div>
            <div className={styles.metricLabel}>
              Pedidos coordinados con éxito
            </div>
          </div>
          <div className={styles.trustStrip__item}>
            <div className={styles.metricNumber}>&lt; 5 min</div>
            <div className={styles.metricLabel}>
              Para publicar tu catálogo y vender
            </div>
          </div>
          <div className={styles.trustStrip__item}>
            <div className={styles.metricNumber}>100%</div>
            <div className={styles.metricLabel}>
              Optimizado para celulares y WhatsApp
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENTO GRID DE FUNCIONALIDADES */}
      <section id="funcionalidades" className={styles.bentoSection}>
        <div className={styles.bentoSection__inner}>
          <div className={styles.bentoSection__header}>
            <h2>Todo lo que necesitas para vender ordenado</h2>
            <p>
              Reemplaza los catálogos en PDF pesados y las notas perdidas en el chat por un sistema
              diseñado para cerrar ventas sin fricción.
            </p>
          </div>

          <div className={styles.bentoSection__grid}>
            {/* CARD 1: SPAN 2 - FLUJO OPERATIVO DE ESTADOS & WHATSAPP */}
            <div className={`${styles.bentoSection__card} ${styles['bentoSection__card--span2']}`}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBadge}>
                  <ClipboardList size={22} />
                </div>
                <h3>Gestión Operativa de Estados & WhatsApp en 1 Clic</h3>
                <p>
                  Cada pedido entra clasificado y listo para gestionar. Con un solo botón abres el
                  chat de WhatsApp con una plantilla personalizada según la etapa en la que se
                  encuentra la compra.
                </p>
              </div>

              <div className={styles.cardVisual}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <span className="badge badge--new">Nuevo: Coordinar pago</span>
                  <span className="badge badge--contacted">Contactado: En preparación</span>
                  <span className="badge badge--confirmed">Confirmado: En despacho</span>
                  <span className="badge badge--delivered">Entregado: Agradecer</span>
                </div>

                <div
                  style={{
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #2e2e2e',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ color: '#ffffff' }}>Mensaje inteligente de WhatsApp:</strong> "¡Hola Carlos! Tu pedido #1042
                    ha sido confirmado y se encuentra en camino..."
                  </div>
                  <span className="btn btn--whatsapp btn--sm" style={{ flexShrink: 0 }}>
                    <MessageCircle size={13} /> Enviar
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: ANALÍTICA Y EMBUDO DE CONVERSIÓN */}
            {/* <div className={styles.bentoSection__card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBadge}>
                  <BarChart3 size={22} />
                </div>
                <h3>Embudo de Conversión en Vivo</h3>
                <p>
                  Descubre exactamente cuántas personas abren tu link, cuántas agregan al carrito y
                  cuántas terminan su compra en WhatsApp.
                </p>
              </div>

              <div className={styles.cardVisual}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>1. Visitas a la tienda</span>
                    <strong>1,420 (100%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>2. Carritos iniciados</span>
                    <strong>340 (24%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>3. Pedidos a WhatsApp</span>
                    <strong style={{ color: '#0a0a0a' }}>84 (5.9% conv.)</strong>
                  </div>
                </div>
              </div>
            </div> */}

            {/* CARD 2: CRM & DIRECTORIO DE CLIENTES */}
            <div className={styles.bentoSection__card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBadge}>
                  <Users size={22} />
                </div>
                <h3>Directorio de Clientes con DNI</h3>
                <p>
                  Cada compra registra automáticamente el nombre, DNI, WhatsApp y total gastado de
                  tus clientes para reactivar ventas y premiar la fidelidad.
                </p>
              </div>
            </div>

            {/* CARD 4: CERO COMISIONES */}
            <div className={styles.bentoSection__card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBadge}>
                  <Zap size={22} />
                </div>
                <h3>Cobro Directo 100% para Ti</h3>
                <p>
                  Sin retenciones de semanas ni pasarelas con comisiones del 5%. Cobras por Yape,
                  Plin o transferencia bancaria directo a tu bolsillo.
                </p>
              </div>
            </div>

            {/* CARD 5: EXPERIENCIA MÓVIL SIN CUENTAS */}
            <div className={styles.bentoSection__card}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBadge}>
                  <Smartphone size={22} />
                </div>
                <h3>Checkout Ágil sin Registro ni Apps</h3>
                <p>
                  El 90% de los compradores abandona carritos si les exigen registrar contraseñas.
                  En Qori ingresan su nombre, DNI y WhatsApp en 15 segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CÓMO FUNCIONA */}
      <section id="como-funciona" className={styles.howItWorks}>
        <div className={styles.howItWorks__inner}>
          <div className={styles.howItWorks__header}>
            <h2>Cómo funciona Qori</h2>
            <p>El camino más directo entre tus redes sociales y tus ventas.</p>
          </div>

          <div className={styles.howItWorks__grid}>
            <div className={styles.howItWorks__card}>
              <div className={styles.stepNumber}>Paso 01</div>
              <h3>Crea tu catálogo</h3>
              <p>
                Agrega el nombre de tu marca, WhatsApp y tus productos con fotos, precios y
                variantes en un par de minutos.
              </p>
            </div>

            <div className={styles.howItWorks__card}>
              <div className={styles.stepNumber}>Paso 02</div>
              <h3>Comparte tu link único</h3>
              <p>
                Coloca tu enlace <code>qori.business/tutienda</code> en la bio de tu Instagram,
                TikTok o estados de WhatsApp.
              </p>
            </div>

            <div className={styles.howItWorks__card}>
              <div className={styles.stepNumber}>Paso 03</div>
              <h3>Cierra en WhatsApp</h3>
              <p>
                Tus clientes eligen productos, llenan sus datos y tú recibes el pedido desglosado
                con DNI listo para despachar y cobrar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING PREVIEW */}
      <section id="funcionalidades" className={styles.pricingPreview}>
        <div className={styles.pricingPreview__inner}>
          <div className={styles.pricingPreview__header}>
            <h2>Un solo precio. Todo incluido.</h2>
            <p>14 días de prueba gratis. Sin comisiones por venta ni cobros ocultos.</p>
          </div>

          <div className={styles.pricingPreview__planCard}>
            <div className={styles.featuredBadge}>14 Días de Prueba Gratis</div>
            <div className={styles.planName}>Plan Qori</div>
            <div className={styles.planTagline}>
              Todo lo que necesitas para vender y crecer ordenadamente por WhatsApp.
            </div>
            <div className={styles.planPrice}>
              S/19.90 <span>/mes</span>
            </div>

            <ul className={styles.planFeatures}>
              <li>
                <Check size={16} /> <strong>14 días de prueba sin costo ni tarjeta</strong>
              </li>
              <li>
                <Check size={16} /> <strong>Productos ilimitados</strong> con fotos y variantes
              </li>
              <li>
                <Check size={16} /> <strong>Pedidos ilimitados</strong> directo a WhatsApp (0% comisión)
              </li>
              <li>
                <Check size={16} /> <strong>Registro con DNI</strong> y directorio de clientes
              </li>
              <li>
                <Check size={16} /> Seguimiento automático y manual de ventas
              </li>
              <li>
                <Check size={16} /> Meta Pixel (Instagram/Facebook) & Google Analytics
              </li>
              <li>
                <Check size={16} /> Embudo de conversión y analíticas en tiempo real
              </li>
            </ul>

            <Link href="/register" className="btn btn--primary btn--full btn--lg">
              Crear tienda con 14 días gratis
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footer__inner}>
          <div className={styles.footer__brand}>
            <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
              <Logo size={52} color="#ffffff" />
            </div>
            <p>
              La infraestructura de venta más rápida y moderna para emprendimientos y marcas que
              venden por WhatsApp en el Perú.
            </p>
          </div>

          <div className={styles.footer__links}>
            <a href="#funcionalidades">Planes</a>
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarse</Link>
          </div>
        </div>

        <div className={styles.footer__copy}>
          © {new Date().getFullYear()} Qori (qori.business) — Todos los derechos reservados. Desarrollado por{' '}
          <a href="https://kubo.pe" target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', fontWeight: 600 }}>
            KUBOstudio
          </a>
        </div>
      </footer>
    </div>
  );
}
