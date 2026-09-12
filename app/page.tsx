'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/styles/modules/landing.module.scss';
import {
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  ArrowDown,
  Check,
  Store,
  ShoppingCart,
  ClipboardList,
  Users,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Lock,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import ScrollReveal from '@/components/ui/ScrollReveal';

const SLIDES = [
  { id: 'slide-0', number: '01', label: 'Inicio' },
  { id: 'slide-1', number: '02', label: 'Dashboard & Métricas' },
  { id: 'slide-2', number: '03', label: 'Funcionalidades' },
  { id: 'slide-3', number: '04', label: 'Cómo funciona' },
  { id: 'slide-4', number: '05', label: 'Plan Qori' },
  { id: 'slide-5', number: '06', label: 'Info & Contacto' },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'orders' | 'store' | 'whatsapp'>('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const scrollToSlide = (index: number) => {
    const target = slideRefs.current[index];
    if (target && containerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSlide(index);
    }
  };

  // Synchronize active slide via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) {
              setActiveSlide(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Keyboard navigation (Arrow keys & Page keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        setActiveSlide((prev) => {
          const next = Math.min(prev + 1, SLIDES.length - 1);
          slideRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return next;
        });
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        setActiveSlide((prev) => {
          const next = Math.max(prev - 1, 0);
          slideRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.page}>
      {/* ===================================================================== */}
      {/* 1. VERTICAL LEFT NAVBAR (Desktop Fixed)                               */}
      {/* ===================================================================== */}
      <aside className={styles.sidebar} aria-label="Navegación principal">
        <div className={styles.sidebar__top}>
          {/* Brand Logo & Name */}
          <Link href="/" className={styles.sidebar__brand} aria-label="Qori - Inicio">
            <Logo size={50} color="#ffffff" />
          </Link>

          {/* Vertical Navigation Slide Links */}
          <nav className={styles.sidebar__nav}>
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollToSlide(idx)}
                className={`${styles.sidebar__navItem} ${
                  activeSlide === idx ? styles['sidebar__navItem--active'] : ''
                }`}
                aria-label={`Ir a diapositiva ${slide.number}: ${slide.label}`}
              >
                <span className={styles.sidebar__navIndex}>{slide.number}</span>
                <span className={styles.sidebar__navLabel}>{slide.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Actions */}
        <div className={styles.sidebar__bottom}>
          <Link href="/login" className={styles.sidebar__loginBtn}>
            Iniciar sesión
          </Link>
          <Link href="/register" className={styles.sidebar__ctaBtn}>
            <span>Crear mi tienda</span>
          </Link>
          <div className={styles.sidebar__tag}>
            <span>●</span> Sistema operativo en vivo
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MOBILE HEADER & DRAWER (< 1024px)                                  */}
      {/* ===================================================================== */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeader__left}>
          <button
            type="button"
            className={styles.mobileHeader__menuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className={styles.mobileHeader__slideIndicator}>
            {SLIDES[activeSlide]?.number} / 06
          </div>
        </div>

        <div className={styles.mobileHeader__logo}>
          <Link href="/" aria-label="Qori - Inicio">
            <Logo size={28} color="#ffffff" />
          </Link>
        </div>

        <div className={styles.mobileHeader__right}>
          <Link href="/register" className={styles.mobileHeader__ctaBtn}>
            Crear tienda
          </Link>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className={styles.mobileHeader__drawerBackdrop}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className={styles.mobileHeader__drawer}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <Logo size={32} color="#ffffff" />
                <span style={{ fontWeight: 700, fontSize: '18px', color: '#ffffff' }}>Qori</span>
              </div>
              <nav className={styles.mobileHeader__drawerNav}>
                {SLIDES.map((slide, idx) => (
                  <button
                    key={`drawer-${slide.id}`}
                    type="button"
                    onClick={() => {
                      scrollToSlide(idx);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`${styles.mobileHeader__drawerNavItem} ${
                      activeSlide === idx ? styles['mobileHeader__drawerNavItem--active'] : ''
                    }`}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>
                      {slide.number}
                    </span>
                    <span>{slide.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className={styles.mobileHeader__drawerBottom}>
              <Link
                href="/login"
                className="btn btn--secondary btn--sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="btn btn--primary btn--sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Crear mi tienda gratis
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 3. RIGHT FLOATING SLIDE DOTS                                          */}
      {/* ===================================================================== */}
      <div className={styles.slideDots} aria-label="Indicadores de diapositiva">
        {SLIDES.map((slide, idx) => (
          <button
            key={`dot-${slide.id}`}
            type="button"
            onClick={() => scrollToSlide(idx)}
            className={`${styles.slideDots__dot} ${
              activeSlide === idx ? styles['slideDots__dot--active'] : ''
            }`}
            aria-label={`Ir a diapositiva ${slide.number}: ${slide.label}`}
            title={`${slide.number} - ${slide.label}`}
          />
        ))}
      </div>

      {/* ===================================================================== */}
      {/* 4. FULL-PAGE SLIDES CONTAINER (SCROLL SNAP ENGINE)                   */}
      {/* ===================================================================== */}
      <div ref={containerRef} className={styles.slidesContainer}>
        {/* ------------------------------------------------------------------- */}
        {/* SLIDE 1: HERO (Título, subtítulo y CTAs)                             */}
        {/* ------------------------------------------------------------------- */}
        <section
          id="slide-0"
          ref={(el) => {
            slideRefs.current[0] = el;
          }}
          className={`${styles.slide} ${styles.slideHero}`}
        >
          <div className={styles.slide__inner}>
            <div className={styles.heroContent}>
              <ScrollReveal animation="fade-up" delay={60}>
                <h1 className={styles.heroTitle}>
                  Tu tienda online. Tus pedidos organizados.{' '}
                  <span className={styles.accent}>Tu WhatsApp.</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={140}>
                <p className={styles.heroSubtitle}>
                  Crea tu catálogo digital en minutos, comparte un solo link en tus redes y recibe
                  compras estructuradas directamente en WhatsApp con panel operativo en tiempo real.
                </p>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={220}>
                <div className={styles.heroCtas}>
                  <Link href="/register" className="btn btn--primary btn--lg">
                    Crear mi tienda gratis <ArrowRight size={18} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollToSlide(3)}
                    className="btn btn--secondary btn--lg"
                  >
                    Ver cómo funciona
                  </button>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-in" delay={300}>
                <button
                  type="button"
                  onClick={() => scrollToSlide(1)}
                  className={styles.scrollHint}
                  aria-label="Ir al siguiente slide"
                >
                  <span>Explorar dashboard y métricas</span>
                  <ArrowDown size={14} />
                </button>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* SLIDE 2: PREVIEW DASHBOARD Y NÚMEROS (Metrics & Showcase)           */}
        {/* ------------------------------------------------------------------- */}
        <section
          id="slide-1"
          ref={(el) => {
            slideRefs.current[1] = el;
          }}
          className={`${styles.slide} ${styles.slideDashboard}`}
        >
          <div className={styles.slide__inner}>
            {/* Trust Metrics Strip */}
            <div className={styles.trustRow}>
              <div className={styles.trustCard}>
                <div className={styles.trustNumber}>
                  <AnimatedCounter value={0} suffix="%" duration={1200} />
                </div>
                <div className={styles.trustLabel}>Comisión por venta (100% tuyo)</div>
              </div>

              <div className={styles.trustCard}>
                <div className={styles.trustNumber}>
                  <AnimatedCounter value={5000} prefix="+" formatThousands duration={1800} />
                </div>
                <div className={styles.trustLabel}>Pedidos coordinados con éxito</div>
              </div>

              <div className={styles.trustCard}>
                <div className={styles.trustNumber}>
                  <AnimatedCounter value={5} prefix="< " suffix=" min" duration={1400} />
                </div>
                <div className={styles.trustLabel}>Para publicar tu catálogo</div>
              </div>

              <div className={styles.trustCard}>
                <div className={styles.trustNumber}>
                  <AnimatedCounter value={100} suffix="%" duration={1600} />
                </div>
                <div className={styles.trustLabel}>Optimizado para celulares</div>
              </div>
            </div>

            {/* Product Showcase Window */}
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
                {/* TAB 1: PANEL DE PEDIDOS */}
                {activeTab === 'orders' && (
                  <div className={styles.mockOrders}>
                    <div className={styles.mockOrders__metrics}>
                      <div className={styles.mockOrders__metricCard}>
                        <div className={styles.metricLabel}>Pedidos del día</div>
                        <div className={styles.metricValue}>
                          <AnimatedCounter value={24} duration={1200} />
                        </div>
                      </div>
                      <div className={styles.mockOrders__metricCard}>
                        <div className={styles.metricLabel}>Ventas del mes</div>
                        <div className={styles.metricValue}>
                          <AnimatedCounter
                            value={1890}
                            prefix="S/ "
                            decimals={2}
                            formatThousands
                            duration={1600}
                          />
                        </div>
                      </div>
                      <div className={styles.mockOrders__metricCard}>
                        <div className={styles.metricLabel}>Clientes activos</div>
                        <div className={styles.metricValue}>
                          <AnimatedCounter value={38} duration={1400} />
                        </div>
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
                        <div className={styles.productPrice}>S/ 89.00</div>
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

                {/* TAB 3: CIERRE EN WHATSAPP */}
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
                          <strong>Cliente:</strong> Carlos Mendoza • <strong>DNI:</strong> 72345678
                        </div>
                        <div>
                          <strong>WhatsApp:</strong> 987654321
                        </div>
                        <div>
                          <strong>Dirección:</strong> Av. Benavides 1420, Miraflores
                        </div>
                        <div style={{ marginTop: '6px', fontWeight: 500 }}>
                          Quiero confirmar mi compra.
                        </div>
                      </div>

                      <div className={styles.mockWhatsApp__bubbleSeller}>
                        <div>¡Hola Carlos! 🙌 Recibimos tu pedido #1042 en Mi Tienda.</div>
                        <div style={{ marginTop: '4px' }}>
                          Lo tenemos listo para despacho hoy mismo. ¿Deseas pagar por{' '}
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

        {/* ------------------------------------------------------------------- */}
        {/* SLIDE 3: TODO LO QUE NECESITAS (Bento Grid)                         */}
        {/* ------------------------------------------------------------------- */}
        <section
          id="slide-2"
          ref={(el) => {
            slideRefs.current[2] = el;
          }}
          className={`${styles.slide} ${styles.slideBento}`}
        >
          <div className={styles.slide__inner}>
            <div className={styles.slideHeader}>
              <ScrollReveal animation="fade-up" delay={40}>
                <h2>Todo lo que necesitas para vender ordenado</h2>
                <p>
                  Reemplaza los catálogos en PDF pesados y las notas perdidas en el chat por un
                  sistema diseñado para cerrar ventas sin fricción.
                </p>
              </ScrollReveal>
            </div>

            <div className={styles.bentoGrid}>
              {/* CARD 1: SPAN 2 - FLUJO OPERATIVO DE ESTADOS & WHATSAPP */}
              <div className={`${styles.bentoCard} ${styles['bentoCard--span2']}`}>
                <div>
                  <div className={styles.cardIcon}>
                    <ClipboardList size={20} />
                  </div>
                  <h3>Gestión Operativa de Estados & WhatsApp en 1 Clic</h3>
                  <p>
                    Cada pedido entra clasificado y listo para gestionar. Con un solo botón abres el
                    chat de WhatsApp con una plantilla inteligente según la etapa de compra.
                  </p>
                </div>

                <div className={styles.visualSnippet}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <span className="badge badge--new">Nuevo: Coordinar</span>
                    <span className="badge badge--contacted">Contactado: Preparar</span>
                    <span className="badge badge--confirmed">Confirmado: Despacho</span>
                    <span className="badge badge--delivered">Entregado: Agradecer</span>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#202020',
                      border: '1px solid #2d2d2d',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>Mensaje inteligente:</strong> &ldquo;¡Hola
                      Carlos! Tu pedido #1042 ha sido confirmado y se encuentra en camino...&rdquo;
                    </div>
                    <span className="btn btn--whatsapp btn--sm" style={{ flexShrink: 0, padding: '3px 10px' }}>
                      <MessageCircle size={13} /> Enviar
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: CRM & DIRECTORIO DE CLIENTES */}
              <div className={styles.bentoCard}>
                <div>
                  <div className={styles.cardIcon}>
                    <Users size={20} />
                  </div>
                  <h3>Directorio de Clientes con DNI</h3>
                  <p>
                    Cada compra registra automáticamente el nombre, DNI, teléfono y monto gastado
                    para reactivar ventas y premiar la fidelidad.
                  </p>
                </div>
              </div>

              {/* CARD 3: CERO COMISIONES */}
              <div className={styles.bentoCard}>
                <div>
                  <div className={styles.cardIcon}>
                    <Zap size={20} />
                  </div>
                  <h3>Cobro Directo 100% para Ti</h3>
                  <p>
                    Sin retenciones de semanas ni pasarelas con comisiones del 5%. Cobras por Yape,
                    Plin o transferencia bancaria directo a tu bolsillo.
                  </p>
                </div>
              </div>

              {/* CARD 4: CHECKOUT ÁGIL */}
              <div className={styles.bentoCard}>
                <div>
                  <div className={styles.cardIcon}>
                    <Smartphone size={20} />
                  </div>
                  <h3>Checkout Ágil sin Registro ni Apps</h3>
                  <p>
                    El 90% de compradores abandona si les exigen contraseñas. En Qori compran con
                    nombre, DNI y WhatsApp en 15 segundos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* SLIDE 4: CÓMO FUNCIONA QORI (3 Pasos)                               */}
        {/* ------------------------------------------------------------------- */}
        <section
          id="slide-3"
          ref={(el) => {
            slideRefs.current[3] = el;
          }}
          className={`${styles.slide} ${styles.slideHow}`}
        >
          <div className={styles.slide__inner}>
            <div className={styles.slideHeader}>
              <ScrollReveal animation="fade-up" delay={40}>
                <h2>Cómo funciona Qori</h2>
                <p>El camino más directo entre tus redes sociales y tus ventas.</p>
              </ScrollReveal>
            </div>

            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepBadge}>
                  <span /> Paso 01
                </div>
                <h3>Crea tu catálogo</h3>
                <p>
                  Agrega el nombre de tu marca, número de WhatsApp y tus productos con fotos,
                  precios y variantes en un par de minutos.
                </p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepBadge}>
                  <span /> Paso 02
                </div>
                <h3>Comparte tu link único</h3>
                <p>
                  Coloca tu enlace <code>qori.business/tutienda</code> en la biografía de Instagram,
                  TikTok o en tus estados de WhatsApp.
                </p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepBadge}>
                  <span /> Paso 03
                </div>
                <h3>Cierra en WhatsApp</h3>
                <p>
                  Tus clientes eligen productos, llenan sus datos y tú recibes el pedido desglosado
                  con DNI listo para despachar y cobrar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* SLIDE 5: PLAN QORI (Pricing Preview)                                */}
        {/* ------------------------------------------------------------------- */}
        <section
          id="slide-4"
          ref={(el) => {
            slideRefs.current[4] = el;
          }}
          className={`${styles.slide} ${styles.slidePricing}`}
        >
          <div className={styles.slide__inner}>
            <div className={styles.slideHeader}>
              <ScrollReveal animation="fade-up" delay={40}>
                <h2>Un solo precio. Todo incluido.</h2>
                <p>14 días de prueba gratis. Sin comisiones por venta ni cobros ocultos.</p>
              </ScrollReveal>
            </div>

            <div className={styles.planCard}>
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
                  <Check size={16} /> <strong>14 días de prueba sin tarjeta</strong>
                </li>
                <li>
                  <Check size={16} /> <strong>Productos ilimitados</strong> con fotos
                </li>
                <li>
                  <Check size={16} /> <strong>Pedidos ilimitados</strong> (0% comisión)
                </li>
                <li>
                  <Check size={16} /> <strong>Directorio con DNI</strong> y clientes
                </li>
                <li>
                  <Check size={16} /> Seguimiento operativo de ventas
                </li>
                <li>
                  <Check size={16} /> Meta Pixel & Google Analytics
                </li>
              </ul>

              <Link href="/register" className="btn btn--primary btn--full btn--lg">
                Crear tienda con 14 días gratis
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* SLIDE 6: FOOTER & CIERRE                                            */}
        {/* ------------------------------------------------------------------- */}
        <section
          id="slide-5"
          ref={(el) => {
            slideRefs.current[5] = el;
          }}
          className={`${styles.slide} ${styles.slideFooter}`}
        >
          <div className={styles.slide__inner}>
            <div className={styles.footerBox}>
              {/* Closing Call to Action Banner */}
              <div className={styles.ctaBanner}>
                <h2>¿Listo para transformar tus ventas por WhatsApp?</h2>
                <p>
                  Únete a los cientos de marcas peruanas que ya organizan sus pedidos y aceleran sus
                  cobros sin pagar comisiones abusivas por venta.
                </p>
                <div className={styles.bannerCtas}>
                  <Link href="/register" className="btn btn--primary btn--lg">
                    Crear mi tienda gratis
                  </Link>
                  <Link href="/login" className="btn btn--secondary btn--lg">
                    Iniciar sesión
                  </Link>
                </div>
              </div>

              {/* Footer Meta & Copyright */}
              <footer className={styles.footerContent}>
                <div className={styles.brandMeta}>
                  <Logo size={32} color="#ffffff" />
                  <p>
                    La infraestructura de venta digital más rápida y moderna para emprendedores que
                    venden por WhatsApp en el Perú.
                  </p>
                </div>

                <div className={styles.linksMeta}>
                  <button
                    type="button"
                    onClick={() => scrollToSlide(4)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888888',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: 0,
                    }}
                  >
                    Planes
                  </button>
                  <Link href="/terminos">Términos y Condiciones</Link>
                  <Link href="/privacidad">Política de Privacidad</Link>
                  <Link href="/login">Iniciar sesión</Link>
                  <Link href="/register">Registrarse</Link>
                </div>
              </footer>

              <div className={styles.copyright}>
                © {new Date().getFullYear()} Qori (qori.business) — Todos los derechos reservados.
                Desarrollado por{' '}
                <a
                  href="https://kubostudio.co"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  KUBOstudio
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
