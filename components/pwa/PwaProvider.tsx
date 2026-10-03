'use client';

import React, { useEffect, useState } from 'react';
import Logo from '@/components/ui/Logo';

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 1. Registro del Service Worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('[PWA] Service Worker registrado correctamente:', reg.scope);
        } catch (error) {
          console.warn('[PWA] No se pudo registrar el Service Worker:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 2. Comportamiento Splash Screen (en modo PWA standalone / app instalada)
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      // Solo mostrar splash si se abre en modo PWA y no se ha mostrado en esta sesión
      const alreadyShown = sessionStorage.getItem('klik_splash_shown');

      if (isStandalone && !alreadyShown) {
        setShowSplash(true);
        sessionStorage.setItem('klik_splash_shown', 'true');

        // Iniciar desvanecimiento a los 850ms
        const fadeTimer = setTimeout(() => {
          setFadeOut(true);
        }, 850);

        // Remover del DOM a los 1250ms
        const removeTimer = setTimeout(() => {
          setShowSplash(false);
        }, 1250);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    }
  }, []);

  return (
    <>
      {showSplash && (
        <div
          id="pwa-splash-screen"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.4s ease, visibility 0.4s ease',
            opacity: fadeOut ? 0 : 1,
            visibility: fadeOut ? 'hidden' : 'visible',
            pointerEvents: fadeOut ? 'none' : 'auto',
          }}
        >
          {/* Logo animado de Klik */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              transform: fadeOut ? 'scale(0.96)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '20px',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 30px rgba(217, 119, 66, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                border: '1px solid rgba(217, 119, 66, 0.15)',
              }}
            >
              <Logo size={56} color="#d97742" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  letterSpacing: '-0.02em',
                }}
              >
                Klik
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#d97742',
                  marginTop: '2px',
                }}
              >
                Tu Tienda Online
              </div>
            </div>

            {/* Barra de progreso sutil y elegante */}
            <div
              style={{
                width: '120px',
                height: '3px',
                backgroundColor: 'rgba(217, 119, 66, 0.15)',
                borderRadius: '999px',
                overflow: 'hidden',
                marginTop: '1.5rem',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#d97742',
                  borderRadius: '999px',
                  animation: 'pwaSplashProgress 0.8s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <style>{`
            @keyframes pwaSplashProgress {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}
      {children}
    </>
  );
}
