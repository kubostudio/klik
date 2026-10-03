"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "@/styles/modules/landing.module.scss";
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
  Percent,
  Timer,
  TrendingUp,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";

const SLIDES = [
  { id: "slide-0", number: "01", label: "Inicio" },
  { id: "slide-1", number: "02", label: "Beneficios" },
  { id: "slide-2", number: "03", label: "Cómo funciona" },
  { id: "slide-3", number: "04", label: "Plan Klik" },
  { id: "slide-4", number: "05", label: "Info & Contacto" },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<"orders" | "store" | "whatsapp">("orders");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const scrollToSlide = (index: number) => {
    const target = slideRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSlide(index);
    }
  };

  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const container = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActiveSlide(index);
          }
        });
      },
      { root: isDesktop ? container : null, threshold: isDesktop ? 0.5 : 0.25 }
    );
    slideRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => { observer.disconnect(); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
      if (["ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        setActiveSlide((prev) => {
          const next = Math.min(prev + 1, SLIDES.length - 1);
          slideRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
          return next;
        });
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        setActiveSlide((prev) => {
          const next = Math.max(prev - 1, 0);
          slideRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.page}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar} aria-label="Navegación principal">
        <div className={styles.sidebar__top}>
          <Link href="/" className={styles.sidebar__brand} aria-label="Klik - Inicio">
            <Logo size={50} color="#d97742" />
          </Link>
          <nav className={styles.sidebar__nav}>
            {SLIDES.map((slide, idx) => (
              <button key={slide.id} type="button" onClick={() => scrollToSlide(idx)}
                className={`${styles.sidebar__navItem} ${activeSlide === idx ? styles["sidebar__navItem--active"] : ""}`}
                aria-label={`Ir a ${slide.label}`}>
                <span className={styles.sidebar__navIndex}>{slide.number}</span>
                <span className={styles.sidebar__navLabel}>{slide.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className={styles.sidebar__bottom}>
          <Link href="/login" className={styles.sidebar__loginBtn}>Iniciar sesión</Link>
          <Link href="/register" className={styles.sidebar__ctaBtn}><span>Crear mi tienda</span></Link>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeader__left}>
          <button type="button" className={styles.mobileHeader__menuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}>
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className={styles.mobileHeader__slideIndicator}>{SLIDES[activeSlide]?.number} / 05</div>
        </div>
        <div className={styles.mobileHeader__logo}>
          <Link href="/" aria-label="Klik - Inicio"><Logo size={28} color="#d97742" /></Link>
        </div>
        <div className={styles.mobileHeader__right}>
          <Link href="/register" className={styles.mobileHeader__ctaBtn}>Crear tienda</Link>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <>
          <div className={styles.mobileHeader__drawerBackdrop} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={styles.mobileHeader__drawer}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                <Logo size={32} color="#d97742" />
                <span style={{ fontWeight: 700, fontSize: "18px", color: "#232323" }}>Klik</span>
              </div>
              <nav className={styles.mobileHeader__drawerNav}>
                {SLIDES.map((slide, idx) => (
                  <button key={`drawer-${slide.id}`} type="button"
                    onClick={() => { scrollToSlide(idx); setIsMobileMenuOpen(false); }}
                    className={`${styles.mobileHeader__drawerNavItem} ${activeSlide === idx ? styles["mobileHeader__drawerNavItem--active"] : ""}`}>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#a08060" }}>{slide.number}</span>
                    <span>{slide.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className={styles.mobileHeader__drawerBottom}>
              <Link href="/login" className="btn btn--secondary btn--sm" onClick={() => setIsMobileMenuOpen(false)}>Iniciar sesión</Link>
              <Link href="/register" className="btn btn--primary btn--sm" onClick={() => setIsMobileMenuOpen(false)}>Crear mi tienda gratis</Link>
            </div>
          </div>
        </>
      )}

      {/* SLIDE DOTS */}
      <div className={styles.slideDots} aria-label="Indicadores de diapositiva">
        {SLIDES.map((slide, idx) => (
          <button key={`dot-${slide.id}`} type="button" onClick={() => scrollToSlide(idx)}
            className={`${styles.slideDots__dot} ${activeSlide === idx ? styles["slideDots__dot--active"] : ""}`}
            aria-label={`Ir a ${slide.label}`} title={`${slide.number} - ${slide.label}`} />
        ))}
      </div>

      {/* SLIDES CONTAINER */}
      <div ref={containerRef} className={styles.slidesContainer}>

        {/* ── SLIDE 01: HERO ── */}
        <section id="slide-0" ref={(el) => { slideRefs.current[0] = el; }}
          className={`${styles.slide} ${styles.slideHero}`}>
          <div className={styles.slide__inner}>
            <div className={styles.heroContent}>
              <ScrollReveal animation="fade-up" delay={60}>
                <div className={styles.heroPill}>
                  <Sparkles size={12} />
                  <span>La forma más simple de vender por WhatsApp</span>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={100}>
                <h1 className={styles.heroTitle}>
                  Tu tienda online.{" "}
                  <span className={styles.accent}>Tus pedidos organizados.</span>{" "}
                  Tu WhatsApp.
                </h1>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={160}>
                <p className={styles.heroSubtitle}>
                  Crea tu catálogo digital en minutos, comparte un solo link y
                  recibe compras directamente en WhatsApp.
                </p>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={220}>
                <div className={styles.heroCtas}>
                  <Link href="/register" className="btn btn--primary btn--lg">
                    Crear mi tienda gratis <ArrowRight size={18} />
                  </Link>
                  <button type="button" onClick={() => scrollToSlide(2)} className="btn btn--secondary btn--lg">
                    Ver cómo funciona
                  </button>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={300}>
                <div className={styles.heroMetrics}>
                  <div className={styles.heroMetric}>
                    <div className={styles.heroMetric__value}><AnimatedCounter value={0} suffix="%" duration={1200} /></div>
                    <div className={styles.heroMetric__label}>Comisión por venta</div>
                  </div>
                  <div className={styles.heroMetric__divider} />
                  <div className={styles.heroMetric}>
                    <div className={styles.heroMetric__value}><AnimatedCounter value={5000} prefix="+" formatThousands duration={1800} /></div>
                    <div className={styles.heroMetric__label}>Pedidos coordinados</div>
                  </div>
                  <div className={styles.heroMetric__divider} />
                  <div className={styles.heroMetric}>
                    <div className={styles.heroMetric__value}><AnimatedCounter value={5} prefix="< " suffix=" min" duration={1400} /></div>
                    <div className={styles.heroMetric__label}>Para publicar tu catálogo</div>
                  </div>
                  <div className={styles.heroMetric__divider} />
                  <div className={styles.heroMetric}>
                    <div className={styles.heroMetric__value}><AnimatedCounter value={100} suffix="%" duration={1600} /></div>
                    <div className={styles.heroMetric__label}>Mobile first</div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-in" delay={380}>
                <button type="button" onClick={() => scrollToSlide(1)} className={styles.scrollHint} aria-label="Ver beneficios">
                  <span>Ver beneficios</span>
                  <ArrowDown size={14} />
                </button>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── SLIDE 02: BENEFICIOS ── */}
        <section id="slide-1" ref={(el) => { slideRefs.current[1] = el; }}
          className={`${styles.slide} ${styles.slideBenefits}`}>
          <div className={styles.slide__inner}>
            <ScrollReveal animation="fade-up" delay={40}>
              <div className={styles.slideHeader}>
                <h2>Todo lo que necesitas para vender ordenado</h2>
                <p>Reemplaza los catálogos en PDF y las notas perdidas en el chat por un sistema diseñado para cerrar ventas sin fricción.</p>
              </div>
            </ScrollReveal>

            <div className={styles.benefitsGrid}>
              <ScrollReveal animation="fade-up" delay={80}>
                <div className={`${styles.benefitCard} ${styles["benefitCard--wide"]}`}>
                  <div className={styles.benefitCard__icon}><ClipboardList size={22} /></div>
                  <div className={styles.benefitCard__body}>
                    <h3>Gestión de pedidos con estados y WhatsApp en 1 clic</h3>
                    <p>Cada pedido entra clasificado y listo para gestionar. Un botón abre WhatsApp con una plantilla inteligente según la etapa: coordinar, confirmar, despachar o agradecer.</p>
                  </div>
                  <div className={styles.benefitCard__visual}>
                    <div className={styles.badgeFlow}>
                      <span className="badge badge--new">Nuevo</span>
                      <span className={styles.badgeArrow}>→</span>
                      <span className="badge badge--contacted">Contactado</span>
                      <span className={styles.badgeArrow}>→</span>
                      <span className="badge badge--confirmed">Confirmado</span>
                      <span className={styles.badgeArrow}>→</span>
                      <span className="badge badge--delivered">Entregado</span>
                    </div>
                    <div className={styles.whatsappSnippet}>
                      <div className={styles.whatsappSnippet__text}>
                        <strong>Mensaje inteligente:</strong>{" "}
                        &ldquo;¡Hola Carlos! Tu pedido #1042 está confirmado y en camino...&rdquo;
                      </div>
                      <span className="btn btn--primary btn--sm" style={{ flexShrink: 0, padding: "3px 10px" }}>
                        <MessageCircle size={13} /> Enviar
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <div className={styles.benefitCards}>
                <ScrollReveal animation="fade-up" delay={120}>
                  <div className={styles.benefitCard}>
                    <div className={styles.benefitCard__icon}><Users size={22} /></div>
                    <h3>Directorio de clientes</h3>
                    <p>Cada compra registra nombre, DNI, teléfono y monto gastado automáticamente para reactivar ventas y premiar la fidelidad.</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={160}>
                  <div className={styles.benefitCard}>
                    <div className={styles.benefitCard__icon}><Zap size={22} /></div>
                    <h3>Cobro directo — 0% comisión</h3>
                    <p>Sin retenciones ni pasarelas con comisiones del 5%. Cobras por Yape, Plin o transferencia bancaria directo a tu bolsillo.</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={200}>
                  <div className={styles.benefitCard}>
                    <div className={styles.benefitCard__icon}><Smartphone size={22} /></div>
                    <h3>Checkout sin registro ni apps</h3>
                    <p>El 90% abandona si les piden contraseñas. En Klik compran con nombre, DNI y WhatsApp en 15 segundos. Sin fricción.</p>
                  </div>
                </ScrollReveal>
              </div>

            </div>
          </div>
        </section>

        {/* ── SLIDE 03: CÓMO FUNCIONA + DEMO (2 columnas) ── */}
        <section id="slide-2" ref={(el) => { slideRefs.current[2] = el; }}
          className={`${styles.slide} ${styles.slideDemo}`}>
          <div className={styles.slide__inner}>
            <div className={styles.demoLayout}>
              {/* LEFT: Pasos */}
              <div className={styles.demoLayout__steps}>
                <ScrollReveal animation="fade-up" delay={40}>
                  <div className={styles.slideHeader} style={{ textAlign: "left", marginBottom: "28px" }}>
                    <h2>Cómo funciona Klik</h2>
                    <p>El camino más directo entre tus redes y tus ventas.</p>
                  </div>
                </ScrollReveal>

                <div className={styles.stepsList}>
                  {[
                    { n: "01", h: "Crea tu catálogo", p: "Agrega tu marca, WhatsApp y productos con fotos, precios y variantes en minutos." },
                    { n: "02", h: "Comparte tu link único", p: <span>Coloca <code className={styles.codeInline}>klik.business/tutienda</code> en tu Instagram, TikTok o estados de WhatsApp.</span> },
                    { n: "03", h: "Cierra en WhatsApp", p: "Tus clientes eligen productos y envían sus datos. Tú recibes el pedido desglosado listo para despachar." },
                  ].map((step, i) => (
                    <ScrollReveal key={step.n} animation="fade-up" delay={80 + i * 50}>
                      <div className={styles.stepItem}>
                        <div className={styles.stepItem__number}>{step.n}</div>
                        <div className={styles.stepItem__body}>
                          <h3>{step.h}</h3>
                          <p>{step.p}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}

                  <ScrollReveal animation="fade-up" delay={240}>
                    <Link href="/register" className="btn btn--primary" style={{ marginTop: "8px", alignSelf: "flex-start" }}>
                      Empezar gratis <ArrowRight size={16} />
                    </Link>
                  </ScrollReveal>
                </div>
              </div>

              {/* RIGHT: Demo interactiva */}
              <div className={styles.demoLayout__showcase}>
                <div className={styles.showcaseWindow}>
                  <div className={styles.showcaseWindow__bar}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className={styles.showcaseWindow__controls}>
                        <div className={styles.showcaseWindow__dot} />
                        <div className={styles.showcaseWindow__dot} />
                        <div className={styles.showcaseWindow__dot} />
                      </div>
                      <div className={styles.showcaseWindow__urlPill}><Lock size={11} /> klik.business/mi-tienda</div>
                    </div>
                    <div className={styles.showcaseWindow__tabs}>
                      {(["orders", "store", "whatsapp"] as const).map((tab) => (
                        <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                          className={`${styles.showcaseWindow__tabBtn} ${activeTab === tab ? styles["showcaseWindow__tabBtn--active"] : ""}`}>
                          {tab === "orders" && <><ClipboardList size={13} /> Pedidos</>}
                          {tab === "store" && <><Store size={13} /> Mi Tienda</>}
                          {tab === "whatsapp" && <><MessageCircle size={13} /> WhatsApp</>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.showcaseWindow__content}>
                    {activeTab === "orders" && (
                      <div className={styles.mockOrders}>
                        <div className={styles.mockOrders__metrics}>
                          <div className={styles.mockOrders__metricCard}>
                            <div className={styles.metricLabel}>Pedidos del día</div>
                            <div className={styles.metricValue}><AnimatedCounter value={24} duration={1200} /></div>
                          </div>
                          <div className={styles.mockOrders__metricCard}>
                            <div className={styles.metricLabel}>Ventas del mes</div>
                            <div className={styles.metricValue}><AnimatedCounter value={1890} prefix="S/ " decimals={2} formatThousands duration={1600} /></div>
                          </div>
                          <div className={styles.mockOrders__metricCard}>
                            <div className={styles.metricLabel}>Clientes activos</div>
                            <div className={styles.metricValue}><AnimatedCounter value={38} duration={1400} /></div>
                          </div>
                        </div>
                        <div className={styles.mockOrders__tableWrapper}>
                          <table className={styles.mockOrders__table}>
                            <thead>
                              <tr>
                                <th>Cliente</th><th>Producto</th><th>Total</th><th style={{ textAlign: "center" }}>Estado</th><th style={{ textAlign: "center" }}>Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { id: "#1042", name: "Carlos Mendoza", dni: "72345678 • 987654321", product: "Polo Heavyweight (x1)", total: "S/ 89.00", badge: <span className="badge badge--new">Nuevo</span>, action: <span className="btn btn--secondary btn--sm" style={{ padding: "3px 10px", fontSize: "11px" }}><MessageCircle size={12} /> Coordinar</span> },
                                { id: "#1041", name: "Andrea Rojas", dni: "45892103 • 912345678", product: "Tote Bag Canvas (x2)", total: "S/ 110.00", badge: <span className="badge badge--contacted">Contactado</span>, action: <span className="btn btn--secondary btn--sm" style={{ padding: "3px 10px", fontSize: "11px" }}><Check size={12} /> Confirmar</span> },
                              ].map((row) => (
                                <tr key={row.id}>
                                  <td>
                                    <div style={{ fontWeight: 600 }}>{row.name}</div>
                                    <div style={{ fontSize: "11px", color: "rgba(35, 35, 35, 0.65)" }}>DNI: {row.dni}</div>
                                  </td>
                                  <td>{row.product}</td>
                                  <td style={{ fontWeight: 600 }}>{row.total}</td>
                                  <td style={{ textAlign: "center" }}>{row.badge}</td>
                                  <td style={{ textAlign: "center" }}>{row.action}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === "store" && (
                      <div className={styles.mockStorefront}>
                        <div className={styles.mockStorefront__header}>
                          <div className={styles.storeAvatar}>AS</div>
                          <h3>Mi Tienda</h3>
                          <p>Moda urbana & esenciales de diseño. Envíos a todo el Perú 🇵🇪</p>
                        </div>
                        <div className={styles.mockStorefront__productCard}>
                          <div className={styles.productThumb}><ShoppingBag size={28} /></div>
                          <div className={styles.productDetails}>
                            <h4>Polo Oversize Heavyweight</h4>
                            <div className={styles.productPrice}>S/ 89.00</div>
                            <div className={styles.variantTags}>
                              <span>Color: Negro</span><span>Talla: L</span><span>En stock</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.mockStorefront__cartBar}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <ShoppingCart size={16} /><span>1 producto • S/ 89.00</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                            Comprar <ArrowRight size={14} />
                          </div>
                        </div>
                        <div style={{ marginTop: "12px", fontSize: "11px", color: "#4b5563", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500 }}>
                          <CheckCircle2 size={13} color="#16a34a" /> Sin crear contraseñas. Solo nombre, DNI y WhatsApp.
                        </div>
                      </div>
                    )}

                    {activeTab === "whatsapp" && (
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
                            <div>Hola, hice el pedido <strong>#1042</strong> en Klik para <strong>Mi Tienda</strong>.</div>
                            <div style={{ marginTop: "4px", fontWeight: 600 }}>Mi pedido:</div>
                            <div className={styles.orderItem}>
                              • <strong>Polo Oversize Heavyweight</strong> (x1) - S/ 89.00
                              <div style={{ fontSize: "11.5px", color: "#54656f" }}>_Color: Negro, Talla: L_</div>
                            </div>
                            <div style={{ marginTop: "4px" }}><strong>Total:</strong> S/ 89.00</div>
                            <div><strong>Cliente:</strong> Carlos Mendoza • <strong>DNI:</strong> 72345678</div>
                            <div><strong>WhatsApp:</strong> 987654321</div>
                            <div style={{ marginTop: "6px", fontWeight: 500 }}>Quiero confirmar mi compra.</div>
                          </div>
                          <div className={styles.mockWhatsApp__bubbleSeller}>
                            <div>¡Hola Carlos! 🙌 Recibimos tu pedido #1042 en Mi Tienda.</div>
                            <div style={{ marginTop: "4px" }}>
                              Lo tenemos listo para despacho hoy mismo. ¿Deseas pagar por{" "}
                              <strong>Yape</strong> o <strong>transferencia BCP</strong>?
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SLIDE 04: PRICING ── */}
        <section id="slide-3" ref={(el) => { slideRefs.current[3] = el; }}
          className={`${styles.slide} ${styles.slidePricing}`}>
          <div className={styles.slide__inner}>
            <div className={styles.pricingLayout}>
              <div className={styles.pricingLayout__left}>
                <ScrollReveal animation="fade-up" delay={40}>
                  <div className={styles.slideHeader} style={{ textAlign: "left", margin: 0 }}>
                    <h2>Un solo precio.<br />Todo incluido.</h2>
                    <p>Sin comisiones por venta ni cobros ocultos.</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal animation="fade-up" delay={120}>
                  <div className={styles.pricingPerks}>
                    {[
                      { icon: <Percent size={18} />, text: "0% comisión por cada venta" },
                      { icon: <TrendingUp size={18} />, text: "Productos y pedidos ilimitados" },
                      { icon: <CheckCircle2 size={18} />, text: "Cancela cuando quieras" },
                    ].map((p, i) => (
                      <div key={i} className={styles.pricingPerk}>
                        {p.icon}<span>{p.text}</span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              <ScrollReveal animation="fade-up" delay={80}>
                <div className={styles.planCard}>
                  <div className={styles.planName}>Plan Klik</div>
                  <div className={styles.planTagline}>Todo lo que necesitas para vender y crecer ordenadamente por WhatsApp.</div>
                  <div className={styles.planPrice}>S/29.90 <span>/mes</span></div>
                  <ul className={styles.planFeatures}>
                    <li><Check size={16} /> <strong>Productos ilimitados</strong> con fotos</li>
                    <li><Check size={16} /> <strong>Pedidos ilimitados</strong> (0% comisión)</li>
                    <li><Check size={16} /> <strong>Directorio con DNI</strong> y clientes</li>
                    <li><Check size={16} /> Seguimiento operativo de ventas</li>
                  </ul>
                  <Link href="/register" className="btn btn--primary btn--full btn--lg">
                    Crear tienda
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── SLIDE 05: CTA + FOOTER ── */}
        <section id="slide-4" ref={(el) => { slideRefs.current[4] = el; }}
          className={`${styles.slide} ${styles.slideFooter}`}>
          <div className={styles.slide__inner}>
            <div className={styles.footerBox}>
              <div className={styles.ctaBanner}>
                <h2>¿Listo para transformar tus ventas por WhatsApp?</h2>
                <p>Únete a los cientos de marcas peruanas que ya organizan sus pedidos y aceleran sus cobros sin pagar comisiones abusivas por venta.</p>
                <div className={styles.bannerCtas}>
                  <Link href="/register" className={styles.bannerBtnPrimary}>
                    Crear mi tienda gratis
                  </Link>
                  <Link href="/login" className={styles.bannerBtnOutline}>
                    Iniciar sesión
                  </Link>
                </div>
              </div>

              <footer className={styles.footerContent}>
                <div className={styles.brandMeta}>
                  <Logo size={32} color="#d97742" />
                  <p>La infraestructura de venta digital más rápida y moderna para emprendedores que venden por WhatsApp en el Perú.</p>
                </div>
                <div className={styles.linksMeta}>
                  <button type="button" onClick={() => scrollToSlide(3)}
                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "13px", padding: 0 }}>
                    Planes
                  </button>
                  <Link href="/terminos">Términos y Condiciones</Link>
                  <Link href="/privacidad">Política de Privacidad</Link>
                  <Link href="/cookies">Política de Cookies</Link>
                  <Link href="/reclamaciones">Libro de Reclamaciones</Link>
                  <Link href="/login">Iniciar sesión</Link>
                  <Link href="/register">Registrarse</Link>
                </div>
              </footer>

              <div className={styles.copyright}>
                © {new Date().getFullYear()} Klik (klik.business) — Todos los derechos reservados. Desarrollado por{" "}
                <a href="https://kubostudio.co" target="_blank" rel="noopener noreferrer">KUBOstudio</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
