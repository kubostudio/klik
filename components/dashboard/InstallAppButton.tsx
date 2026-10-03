'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, Monitor, Smartphone, X, Check, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface InstallAppButtonProps {
  variant?: 'topbar' | 'mobile' | 'sidebar' | 'mobile-menu';
  onAction?: () => void;
}

export default function InstallAppButton({ variant = 'topbar', onAction }: InstallAppButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    setIsMounted(true);

    // Detectar si ya está en modo standalone (instalada)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detectar plataforma
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Capturar el evento beforeinstallprompt (Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Si no está montado en cliente o ya está instalada/abierta como app nativa, no mostrar el botón
  if (!isMounted || isStandalone || isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (onAction) onAction();

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al invocar instalación:', err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Botón según la variante solicitada */}
      {variant === 'topbar' && (
        <button
          onClick={handleClick}
          className="btn btn--outline btn--sm"
          title="Instalar Klik en tu computadora o teléfono"
          style={{
            borderColor: 'rgba(217, 119, 66, 0.4)',
            color: '#d97742',
            backgroundColor: 'rgba(217, 119, 66, 0.05)',
            fontWeight: 600,
          }}
        >
          <Download size={14} />
          <span>Instalar App</span>
        </button>
      )}

      {variant === 'mobile' && (
        <button
          onClick={handleClick}
          className="btn btn--outline btn--sm"
          title="Instalar App"
          style={{
            padding: '0 10px',
            gap: '6px',
            borderColor: 'rgba(217, 119, 66, 0.4)',
            color: '#d97742',
            backgroundColor: 'rgba(217, 119, 66, 0.06)',
            fontWeight: 600,
          }}
        >
          <Download size={14} />
          <span style={{ fontSize: '0.78rem' }}>App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <div style={{ padding: '0.75rem 0.75rem 0' }}>
          <button
            onClick={handleClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid rgba(217, 119, 66, 0.25)',
              backgroundColor: 'rgba(217, 119, 66, 0.06)',
              color: '#d97742',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 66, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 66, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 66, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 66, 0.25)';
            }}
          >
            <Download size={15} />
            <span>Instalar App Klik</span>
          </button>
        </div>
      )}

      {variant === 'mobile-menu' && (
        <button
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#d97742',
            backgroundColor: 'rgba(217, 119, 66, 0.08)',
            border: '1px solid rgba(217, 119, 66, 0.2)',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            marginTop: '0.25rem',
          }}
        >
          <Download size={18} />
          <span>Instalar App en este dispositivo</span>
        </button>
      )}

      {/* Modal interactivo de instrucciones para casos donde no se dispara el prompt automático */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
              border: '1px solid rgba(217, 119, 66, 0.15)',
              overflow: 'hidden',
              animation: 'fadeInUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(217, 119, 66, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97742',
                  }}
                >
                  {platform === 'ios' || platform === 'android' ? (
                    <Smartphone size={20} />
                  ) : (
                    <Monitor size={20} />
                  )}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#1a1a1a',
                    }}
                  >
                    Instalar Klik Business
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      color: '#666',
                    }}
                  >
                    Acceso rápido como aplicación nativa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido / Pasos según plataforma */}
            <div style={{ padding: '1.5rem' }}>
              <div
                style={{
                  backgroundColor: '#fafafa',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <img
                    src="/icon-192.png"
                    alt="Klik Icon"
                    width={44}
                    height={44}
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                    Klik Business
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    Sin descargar desde App Store o Play Store. No ocupa espacio.
                  </div>
                </div>
              </div>

              {platform === 'ios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      En <strong>Safari</strong>, toca el botón{' '}
                      <strong>Compartir</strong>{' '}
                      <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#007AFF' }} /> en la barra inferior.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      Desliza hacia abajo y pulsa{' '}
                      <strong>&quot;Agregar a inicio&quot;</strong>{' '}
                      <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      Toca <strong>&quot;Agregar&quot;</strong> arriba a la derecha para tener Klik en tu pantalla de inicio como una App.
                    </div>
                  </div>
                </div>
              )}

              {platform === 'android' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      Toca el menú de tu navegador (los <strong>tres puntos ⋮</strong> arriba a la derecha).
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      Selecciona <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      Confirma pulsando <strong>&quot;Instalar&quot;</strong>.
                    </div>
                  </div>
                </div>
              )}

              {platform === 'desktop' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      En Chrome o Edge, busca el ícono de instalación (<strong>⊕</strong> o pantalla con flecha) en la parte derecha de la barra de direcciones.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      O abre el menú del navegador (<strong>⋮</strong>) y selecciona <strong>&quot;Instalar Klik...&quot;</strong>.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#d97742',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.4 }}>
                      Klik se abrirá en su propia ventana sin barras, funcionando como una aplicación de escritorio.
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="btn btn--primary btn--full"
                style={{
                  marginTop: '1.5rem',
                  height: '42px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
