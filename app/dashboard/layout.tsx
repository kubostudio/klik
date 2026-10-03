"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/modules/dashboard.module.scss";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Clock,
  Settings,
  ExternalLink,
  Share2,
  Menu,
  X,
  AlertTriangle,
  MessageCircle,
  Lock,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import InstantOrderNotifier from "@/components/dashboard/InstantOrderNotifier";
import NotificationBell from "@/components/dashboard/NotificationBell";
import InstallAppButton from "@/components/dashboard/InstallAppButton";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { store, isLoadingStore } = useDashboard();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Productos", icon: Package },
    { href: "/dashboard/orders", label: "Pedidos", icon: ShoppingBag },
    { href: "/dashboard/customers", label: "Clientes", icon: Users },
    { href: "/dashboard/follow-ups", label: "Seguimiento", icon: Clock },
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
  ];

  const currentSlug = store?.slug || "";
  const currentName = store?.name || "";

  const handleShareStore = () => {
    if (!currentSlug) return;
    const url = `https://klik.sale/${currentSlug}`;
    if (navigator.share) {
      navigator
        .share({
          title: currentName || "Mi Tienda",
          text: `Compra en ${currentName || "Mi Tienda"} a través de nuestro catálogo online:`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Notificador global de pedidos en tiempo real */}
      <InstantOrderNotifier />

      {/* DESKTOP SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__brand}>
          <Link href="/dashboard" className={styles.logo}>
            <Logo size={50} color="#d97742" />
          </Link>
        </div>

        <nav className={styles.sidebar__nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebar__link} ${isActive ? styles["sidebar__link--active"] : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Botón de instalación de PWA en la barra lateral */}
        <div style={{ marginTop: "auto", paddingBottom: "1rem" }}>
          <InstallAppButton variant="sidebar" />
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className={styles.mainContent}>
        {/* MOBILE HEADER */}
        <header className={styles.mobileHeader}>
          <Link
            href="/dashboard"
            className={styles.logo}
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#0a0a0a",
              borderRadius: "10px",
              padding: "5px 12px",
              textDecoration: "none",
            }}
          >
            <Logo size={36} color="#ffffff" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <InstallAppButton variant="mobile" />
            <NotificationBell />
            {currentSlug && store?.is_active !== false && (
              <button
                onClick={handleShareStore}
                className="btn btn--secondary btn--sm"
              >
                <Share2 size={14} /> {copied ? "¡Copiado!" : "Compartir"}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={styles.menuBtn}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* MOBILE DROPDOWN MENU */}
        {mobileMenuOpen && (
          <nav className={styles.mobileMenu}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${styles.sidebar__link} ${isActive ? styles["sidebar__link--active"] : ""}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {currentSlug && store?.is_active !== false && (
              <Link
                href={`/${currentSlug}`}
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className={styles.sidebar__link}
              >
                <ExternalLink size={18} />
                <span>Ver mi tienda pública</span>
              </Link>
            )}
            <InstallAppButton
              variant="mobile-menu"
              onAction={() => setMobileMenuOpen(false)}
            />
          </nav>
        )}

        {/* DESKTOP TOPBAR */}
        <div className={styles.topbar}>
          {isLoadingStore && !store ? (
            <div className={styles.topbarSkeleton}>
              <div className={styles.skeletonText} />
              <div className={styles.skeletonSlug} />
              <div className={styles.skeletonBadge} />
            </div>
          ) : (
            <div
              className={styles.welcome}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span style={{ fontWeight: 600 }}>
                {currentName || "Mi Tienda"}
              </span>
              {currentSlug ? (
                <span
                  style={{
                    color: "var(--color-mid-gray)",
                    fontWeight: 400,
                    fontSize: "0.875rem",
                  }}
                >
                  — klik.sale/{currentSlug}
                </span>
              ) : (
                <span
                  style={{
                    color: "var(--color-mid-gray)",
                    fontWeight: 400,
                    fontSize: "0.875rem",
                  }}
                >
                  — Tienda pendiente de publicación
                </span>
              )}
              {store?.is_active === false ? (
                <span
                  className="badge"
                  style={{
                    backgroundColor: "#fff7ed",
                    color: "#c2410c",
                    border: "1px solid rgba(234, 88, 12, 0.3)",
                    fontWeight: 600,
                  }}
                  title="Tu tienda está pendiente de activación por suscripción"
                >
                  ● Pendiente de activación
                </span>
              ) : (
                <span
                  className="badge badge--soft"
                  title="Sistema en línea y sincronizado"
                >
                  ● En línea
                </span>
              )}
            </div>
          )}

          <div className={styles.actions}>
            {isLoadingStore && !store ? (
              <div className={styles.skeletonButton} />
            ) : (
              <>
                <InstallAppButton variant="topbar" />
                {currentSlug ? (
                  <>
                    <NotificationBell />
                    {store?.is_active === false ? (
                      <button
                        disabled
                        className="btn btn--secondary btn--sm"
                        style={{
                          opacity: 0.6,
                          cursor: "not-allowed",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                        title="Tu tienda aún no ha sido activada"
                      >
                        <Lock size={13} /> Tienda Inactiva
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/${currentSlug}`}
                          target="_blank"
                          className="btn btn--outline btn--sm"
                        >
                          <ExternalLink size={14} /> Ver tienda
                        </Link>
                        <button
                          onClick={handleShareStore}
                          className="btn btn--primary btn--sm"
                        >
                          <Share2 size={14} />{" "}
                          {copied ? "¡Enlace copiado!" : "Compartir mi tienda"}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <Link
                    href="/dashboard/settings"
                    className="btn btn--primary btn--sm"
                  >
                    + Configurar mi Tienda
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* AVISO DE ACTIVACIÓN PENDIENTE (KUBOstudio 906013310) */}
        {store && store.is_active === false && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    color: "#92400e",
                  }}
                >
                  ¡Tu tienda fue creada! Para activarla y recibir pedidos:
                </div>
                <div
                  style={{
                    fontSize: "0.825rem",
                    color: "#b45309",
                    marginTop: "2px",
                    lineHeight: 1.4,
                  }}
                >
                  Para activar tu catálogo y publicar tu tienda, debes confirmar
                  el pago de la suscripción con{" "}
                  <strong>KUBOstudio</strong>.
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/51906013310?text=${encodeURIComponent(
                `Hola KUBOstudio, solicito activar la suscripción para mi tienda ${store.name || currentName} (slug: ${store.slug || currentSlug})`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--sm"
              style={{
                textDecoration: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <MessageCircle size={15} /> Activar tienda
            </a>
          </div>
        )}

        {/* VIEW BODY */}
        <div className={styles.viewContainer}>
          {store && store.is_active === false && pathname !== "/dashboard/settings" ? (
            <div
              style={{
                maxWidth: "680px",
                margin: "2rem auto",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  padding: "2.5rem 2rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(217, 119, 66, 0.25)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "#fff7ed",
                    color: "#c2410c",
                    border: "1px solid rgba(234, 88, 12, 0.3)",
                    borderRadius: "999px",
                    padding: "0.25rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginBottom: "1rem",
                  }}
                >
                  ● Tienda Inactiva — Pendiente de Pago
                </div>

                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Activa tu tienda {currentName || store.name} para empezar a vender
                </h2>

                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#666",
                    lineHeight: 1.6,
                    maxWidth: "520px",
                    margin: "0 auto 2rem",
                  }}
                >
                  Tu tienda está creada, pero las funciones del panel (catálogo público, inventario de productos y recepción de pedidos por WhatsApp) se encuentran temporalmente bloqueadas hasta confirmar el pago de tu suscripción con <strong>KUBOstudio</strong>.
                </p>

                <div
                  style={{
                    backgroundColor: "#fafafa",
                    border: "1px solid #ebebeb",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    textAlign: "left",
                    marginBottom: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.875rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "#d97742",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.4 }}>
                      Escríbenos al WhatsApp oficial de <strong>KUBOstudio</strong> solicitando la activación de tu tienda.
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "#d97742",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.4 }}>
                      Envía el comprobante de pago de tu plan (Yape, Plin o Transferencia bancaria).
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "#d97742",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.4 }}>
                      El equipo de KUBOstudio activará tu tienda en la base de datos y se desbloquearán todas las funciones y tu catálogo público al instante.
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/51906013310?text=${encodeURIComponent(
                    `Hola KUBOstudio, solicito activar la suscripción para mi tienda ${store.name || currentName} (slug: ${store.slug || currentSlug})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--lg"
                  style={{
                    textDecoration: "none",
                    width: "100%",
                    height: "48px",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                  }}
                >
                  <MessageCircle size={20} /> Solicitar activación por WhatsApp
                </a>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}
