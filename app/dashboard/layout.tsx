'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore } from '@/lib/supabase/db';
import { Store } from '@/lib/supabase/types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Clock,
  Settings,
  ExternalLink,
  Share2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [store, setStore] = useState<Store | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCurrentStore().then(setStore);
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Productos', icon: Package },
    { href: '/dashboard/orders', label: 'Pedidos', icon: ShoppingBag },
    { href: '/dashboard/customers', label: 'Clientes', icon: Users },
    // { href: '/dashboard/analytics', label: 'Estadísticas', icon: BarChart3 }, // Retomaremos en v2
    { href: '/dashboard/follow-ups', label: 'Seguimiento', icon: Clock },
    { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  ];

  const currentPlan = store?.plan || 'starter';
  const currentSlug = store?.slug || '';
  const currentName = store?.name || 'Mi Tienda';

  const handleShareStore = () => {
    const url = `https://qori.business/${currentSlug}`;
    if (navigator.share) {
      navigator.share({
        title: currentName,
        text: `Compra en ${currentName} a través de nuestro catálogo online:`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.layout}>
      {/* DESKTOP SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__brand}>
          <Link
            href="/dashboard"
            className={styles.logo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#0a0a0a',
              borderRadius: '12px',
              padding: '6px 14px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Logo size={44} color="#ffffff" />
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
                className={`${styles.sidebar__link} ${isActive ? styles['sidebar__link--active'] : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* LINK TIENDA */}
        {/* <div className={styles.sidebar__storeLink}>
          {currentSlug ? (
            <Link href={`/${currentSlug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Ver mi tienda</span>
              <ExternalLink size={12} />
            </Link>
          ) : (
            <Link href="/onboarding" style={{ color: '#D97706' }}>
              + Crear tienda
            </Link>
          )}
          {currentSlug && (
            <button
              onClick={handleShareStore}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              title="Compartir enlace"
            >
              <Share2 size={14} />
            </button>
          )}
        </div> */}
      </aside>

      {/* MAIN CONTAINER */}
      <div className={styles.mainContent}>
        {/* MOBILE HEADER */}
        <header className={styles.mobileHeader}>
          <Link
            href="/dashboard"
            className={styles.logo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#0a0a0a',
              borderRadius: '10px',
              padding: '5px 12px',
              textDecoration: 'none',
            }}
          >
            <Logo size={36} color="#ffffff" />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentSlug && (
              <button onClick={handleShareStore} className="btn btn--secondary btn--sm">
                <Share2 size={14} /> {copied ? '¡Copiado!' : 'Compartir'}
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
                  className={`${styles.sidebar__link} ${isActive ? styles['sidebar__link--active'] : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {currentSlug && (
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
          </nav>
        )}

        {/* DESKTOP TOPBAR */}
        <div className={styles.topbar}>
          <div className={styles.welcome} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>{currentName}</span>
            {currentSlug ? (
              <span style={{ color: 'var(--color-mid-gray)', fontWeight: 400, fontSize: '0.875rem' }}>
                — qori.business/{currentSlug}
              </span>
            ) : (
              <span style={{ color: 'var(--color-mid-gray)', fontWeight: 400, fontSize: '0.875rem' }}>
                — Tienda pendiente de publicación
              </span>
            )}
            <span className="badge badge--soft" title="Sistema en línea y sincronizado">
              ● En línea
            </span>
          </div>
          <div className={styles.actions}>
            {currentSlug ? (
              <>
                <Link href={`/${currentSlug}`} target="_blank" className="btn btn--outline btn--sm">
                  <ExternalLink size={14} /> Ver tienda
                </Link>
                <button onClick={handleShareStore} className="btn btn--primary btn--sm">
                  <Share2 size={14} /> {copied ? '¡Enlace copiado!' : 'Compartir mi tienda'}
                </button>
              </>
            ) : (
              <Link href="/dashboard/settings" className="btn btn--primary btn--sm">
                + Configurar mi Tienda
              </Link>
            )}
          </div>
        </div>

        {/* VIEW BODY */}
        <div className={styles.viewContainer}>{children}</div>
      </div>
    </div>
  );
}
