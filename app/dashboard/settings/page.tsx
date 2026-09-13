'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/styles/modules/dashboard.module.scss';
import { getCurrentStore, getStoreIntegration, updateStore, createStore, saveStoreIntegration } from '@/lib/supabase/db';
import { Store, StoreIntegration, PlanType } from '@/lib/supabase/types';
import { slugify } from '@/lib/utils';
import ImageUpload from '@/components/ui/ImageUpload';
import { useDashboard } from '@/contexts/DashboardContext';
import { Check, Sparkles, AlertCircle, Save, ExternalLink, Loader2, Instagram, ArrowDown } from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'billing' ? 'billing' : 'store';

  const { store: contextStore, refreshStore, updateStoreLocally } = useDashboard();
  const [activeTab, setActiveTab] = useState<'store' | 'pixels' | 'billing'>(initialTab);
  const [store, setStore] = useState<Store | null>(contextStore);
  const [integration, setIntegration] = useState<StoreIntegration | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Instagram import states
  const [instaHandleInput, setInstaHandleInput] = useState('');
  const [isImportingInsta, setIsImportingInsta] = useState(false);
  const [instaFeedback, setInstaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Store fields
  const [name, setName] = useState(contextStore?.name || '');
  const [slug, setSlug] = useState(contextStore?.slug || '');
  const [description, setDescription] = useState(contextStore?.description || '');
  const [logoUrl, setLogoUrl] = useState(contextStore?.logo_url || '');
  const [whatsapp, setWhatsapp] = useState(contextStore?.whatsapp || '');
  const [instagram, setInstagram] = useState(contextStore?.instagram || '');
  const [facebook, setFacebook] = useState(contextStore?.facebook || '');
  const [city, setCity] = useState(contextStore?.city || '');

  // Pixel fields (Section 29 - Pro)
  const [gaId, setGaId] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');

  // Billing state
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const currentStore = contextStore || (await getCurrentStore());
      setStore(currentStore);
      if (currentStore) {
        setName(currentStore.name || '');
        setSlug(currentStore.slug || '');
        setDescription(currentStore.description || '');
        setLogoUrl(currentStore.logo_url || '');
        setWhatsapp(currentStore.whatsapp || '');
        setInstagram(currentStore.instagram || '');
        setFacebook(currentStore.facebook || '');
        setCity(currentStore.city || '');

        const currentIntegration = await getStoreIntegration(currentStore.id);
        setIntegration(currentIntegration);
        setGaId(currentIntegration?.google_analytics_id || '');
        setMetaPixelId(currentIntegration?.meta_pixel_id || '');
      }
      setLoading(false);
    }

    loadSettings();
  }, [contextStore?.id]);

  const handleImportInstagram = async (overrideUser?: string) => {
    const rawTarget = (overrideUser || instaHandleInput || instagram).trim();
    if (!rawTarget) {
      setInstaFeedback({
        type: 'error',
        message: 'Por favor ingresa un nombre de usuario de Instagram (ej. @mitienda)',
      });
      return;
    }

    setIsImportingInsta(true);
    setInstaFeedback(null);

    try {
      const res = await fetch('/api/instagram/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawTarget }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'No se pudieron extraer los datos de la cuenta.');
      }

      const { data } = result;
      if (data.name) setName(data.name);
      if (!slug || slug.trim() === '') setSlug(slugify(data.name || data.username));
      if (data.description) setDescription(data.description);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.whatsapp) setWhatsapp(data.whatsapp);
      if (data.city) setCity(data.city);
      if (data.instagram) {
        setInstagram(data.instagram);
        setInstaHandleInput(data.instagram);
      }

      const summaryList = [];
      if (data.name) summaryList.push('Nombre');
      if (data.description) summaryList.push('Biografía');
      if (data.logoUrl) summaryList.push('Logo');
      if (data.whatsapp) summaryList.push('WhatsApp');
      if (data.city) summaryList.push('Ciudad');

      setInstaFeedback({
        type: 'success',
        message: `¡Perfil @${data.username} importado con éxito! Se cargaron: ${summaryList.join(', ')}. Recuerda hacer clic en "Guardar Datos" para guardar en tu tienda.`,
      });
    } catch (err: any) {
      setInstaFeedback({
        type: 'error',
        message: err.message || 'Error al conectar con Instagram.',
      });
    } finally {
      setIsImportingInsta(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (!store) {
        if (!name.trim()) {
          setErrorMessage('Por favor, ingresa el nombre de tu tienda.');
          return;
        }
        if (!whatsapp.trim()) {
          setErrorMessage('Por favor, ingresa el número de WhatsApp.');
          return;
        }

        const created = await createStore({
          name: name.trim(),
          slug: slugify(slug.trim() || name.trim() || 'mi-tienda'),
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
          whatsapp: whatsapp.trim(),
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          city: city.trim() || null,
          plan: currentPlan,
        });

        if (created) {
          setStore(created);
          updateStoreLocally(created);
          refreshStore();
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2500);
        } else {
          setErrorMessage('Error al crear la tienda. Por favor verifica los datos.');
        }
        return;
      }

      const updated = await updateStore(store.id, {
        name: name.trim(),
        slug: slugify(slug.trim() || name.trim()),
        description: description.trim(),
        logo_url: logoUrl.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        city: city.trim() || null,
      });

      if (updated) {
        setStore(updated);
        updateStoreLocally(updated);
        refreshStore();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        setErrorMessage('Error al actualizar la tienda. Por favor intenta de nuevo.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado al conectar con la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePixels = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!store) {
      setErrorMessage('Primero debes crear y guardar los datos de tu tienda antes de configurar píxeles.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await saveStoreIntegration(store.id, {
        google_analytics_id: gaId.trim() || null,
        meta_pixel_id: metaPixelId.trim() || null,
      });

      if (updated) {
        setIntegration(updated);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar los píxeles.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchPlan = async (targetPlan: PlanType) => {
    if (!store) return;
    setIsUpgrading(true);
    try {
      await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, storeId: store.id }),
      });
      const updated = await updateStore(store.id, { plan: targetPlan });
      if (updated) setStore(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentPlan = store?.plan || 'starter';
  const isPro = currentPlan === 'pro';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Configuración de la Tienda
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Personaliza la identidad, enlaces y funciones avanzadas de tu tienda online.
          </p>
        </div>

        {savedSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--color-canvas)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-hairline)',
              padding: '0.4rem 0.85rem',
              borderRadius: '18px',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            <Check size={14} /> Cambios guardados correctamente
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('store')}
          className={`btn btn--sm ${activeTab === 'store' ? 'btn--primary' : 'btn--secondary'}`}
        >
          Datos de Tienda
        </button>
        {/* <button
          onClick={() => setActiveTab('pixels')}
          className={`btn btn--sm ${activeTab === 'pixels' ? 'btn--primary' : 'btn--secondary'}`}
        >
          Pixel & Analytics
        </button> */}
        <button
          onClick={() => setActiveTab('billing')}
          className={`btn btn--sm ${activeTab === 'billing' ? 'btn--primary' : 'btn--secondary'}`}
        >
          Plan & Facturación
        </button>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            maxWidth: '640px',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: DATOS DE TIENDA */}
      {activeTab === 'store' && (
        <div className={styles.panel} style={{ maxWidth: '640px' }}>
          <div className={styles.panel__header}>
            <h2>{store ? 'Información pública y WhatsApp' : 'Crear mi Tienda Online'}</h2>
          </div>
          <div className={styles.panel__body}>
            {!store && (
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={18} />
                <span>
                  Aún no tienes una tienda registrada. Ingresa tus datos aquí y haz clic en <strong>Crear mi Tienda</strong> para comenzar.
                </span>
              </div>
            )}

            {/* INSTAGRAM FAST IMPORT BOX */}
            <div
              style={{
                backgroundColor: 'var(--color-canvas)',
                border: '1px solid var(--color-hairline)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginBottom: '0.4rem',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-ink)',
                    color: 'var(--color-paper)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Instagram size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    Importar detalles desde Instagram
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)', margin: 0 }}>
                    Autocompleta nombre, bio, logo en alta calidad, WhatsApp y ciudad con tu @usuario.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.85rem',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. @mitienda o enlace de perfil"
                  value={instaHandleInput}
                  onChange={(e) => setInstaHandleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleImportInstagram();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => handleImportInstagram()}
                  disabled={isImportingInsta}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isImportingInsta ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Importar</span>
                    </>
                  )}
                </button>
              </div>

              {instaFeedback && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    backgroundColor: instaFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: instaFeedback.type === 'success' ? '#86efac' : '#f87171',
                    border: `1px solid ${instaFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  {instaFeedback.type === 'success' ? (
                    <Check size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  ) : (
                    <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  )}
                  <span>{instaFeedback.message}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveStore}>
              <div className="form-group">
                <label>Nombre de la tienda *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Lima Trends, Mi Emprendimiento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>URL personalizada (slug)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748B' }}>qori.business/</span>
                  <input
                    type="text"
                    className="input"
                    placeholder="lima-trends"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>WhatsApp de Ventas *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+51 999 888 777"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                />
                <span className="helper-text">
                  Los compradores enviarán sus pedidos directamente a este número.
                </span>
              </div>

              <div className="form-group">
                <label>Descripción / Bio</label>
                <textarea
                  className="textarea"
                  placeholder="Describe brevemente tus productos y envíos"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <ImageUpload
                label="Foto de Perfil / Logo de la Tienda"
                value={logoUrl}
                onChange={setLogoUrl}
                folder="stores"
                helperText="Se muestra en la parte superior de tu catálogo público."
                placeholderText="Arrastra o sube el logo de tu tienda"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ margin: 0 }}>Instagram (@usuario)</label>
                    {instagram && (
                      <button
                        type="button"
                        onClick={() => handleImportInstagram(instagram)}
                        disabled={isImportingInsta}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-ink)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        {isImportingInsta ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                        Sincronizar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="input"
                    placeholder="@mitienda"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Lima, Arequipa..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{ marginTop: '1rem' }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Guardando datos...
                  </>
                ) : (
                  <>
                    <Save size={16} /> {store ? 'Guardar Datos' : 'Crear mi Tienda'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PIXEL / ANALYTICS */}
      {/* {activeTab === 'pixels' && (
        <div className={styles.panel} style={{ maxWidth: '640px' }}>
          <div className={styles.panel__header}>
            <h2>Píxeles publicitarios y analítica externa</h2>
          </div>
          <div className={styles.panel__body}>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Conecta Meta Pixel (Facebook / Instagram), TikTok y Google Analytics (GA4) para medir las visitas y conversiones de tus campañas.
            </p>
            <form onSubmit={handleSavePixels}>
              <div className="form-group">
                <label>Google Analytics — Measurement ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="G-XXXXXXXXXX"
                  value={gaId}
                  onChange={(e) => setGaId(e.target.value)}
                />
                <span className="helper-text">Se inyectará automáticamente en tu catálogo online.</span>
              </div>

              <div className="form-group">
                <label>Meta Pixel — Pixel ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. 123456789012345"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                />
                <span className="helper-text">Disparará eventos automáticos de ViewContent, AddToCart y Purchase.</span>
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: '1rem' }} disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Guardar Integraciones
              </button>
            </form>
          </div>
        </div>
      )} */}

      {/* TAB 3: BILLING & PLAN */}
      {activeTab === 'billing' && (
        <div style={{ maxWidth: '720px' }}>
          <div className={styles.panel}>
            <div className={styles.panel__header}>
              <h2>Tu Suscripción Qori</h2>
            </div>
            <div className={styles.panel__body}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--color-hairline)', borderRadius: '16px', backgroundColor: 'var(--color-surface-alt)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Precio del Plan</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--color-ink)' }}>S/19.90 <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-mid-gray)' }}>/mes</span></div>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--color-hairline)', borderRadius: '16px', backgroundColor: 'var(--color-surface-alt)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Prueba Gratuita</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.25rem', color: '#facc15' }}>
                    14 días incluidos
                  </div>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--color-hairline)', borderRadius: '16px', backgroundColor: 'var(--color-surface-alt)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Estado del Servicio</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.25rem', color: '#86efac' }}>
                    Activo
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--color-ink)' }}>
                  Beneficios incluidos en tu Plan Qori:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-mid-gray)', lineHeight: 1.7 }}>
                  <li>Productos ilimitados con fotos y carrusel interactivo Slick</li>
                  <li>Pedidos ilimitados directo a WhatsApp (0% comisiones sobre ventas)</li>
                  <li>Seguimiento automático y manual de compradores por WhatsApp</li>
                  {/* <li>Píxeles de Meta (Instagram/Facebook) y Google Analytics (GA4)</li> */}
                  {/* <li>Estadísticas en tiempo real, visitas y tasa de conversión</li> */}
                  <li>Soporte y atención directa por WhatsApp</li>
                </ul>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--color-mid-gray)', lineHeight: 1.5 }}>
                Tu suscripción se procesa de forma segura a través de Culqi con tarjetas de crédito o débito. No hay contratos de permanencia y puedes cancelar en cualquier momento.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsDashboardPage() {
  return (
    <Suspense fallback={<div>Cargando configuración...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

