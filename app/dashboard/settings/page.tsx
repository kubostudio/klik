"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/styles/modules/dashboard.module.scss";
import {
  getCurrentStore,
  getStoreIntegration,
  updateStore,
  createStore,
  saveStoreIntegration,
  getStoreBilling,
  updateStoreBilling,
} from "@/lib/supabase/db";
import { Store, StoreIntegration, PlanType, StoreBillingInfo, BankAccount, DigitalWallet } from "@/lib/supabase/types";
import { slugify } from "@/lib/utils";
import ImageUpload from "@/components/ui/ImageUpload";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  Check,
  Sparkles,
  AlertCircle,
  Save,
  Loader2,
  Instagram,
  Plus,
  Trash2,
  Smartphone,
  Building2,
  QrCode,
  X,
  MessageCircle,
} from "lucide-react";

const BANKS = ["BCP", "BBVA", "Interbank", "Scotiabank", "Banco de la Nación", "Pichincha", "BanBif", "Otro"];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams?.get("tab") === "billing" ? "billing" : "store";

  const {
    store: contextStore,
    refreshStore,
    updateStoreLocally,
  } = useDashboard();
  const [activeTab, setActiveTab] = useState<"store" | "billing">(initialTab);
  const [store, setStore] = useState<Store | null>(contextStore);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Instagram import states
  const [instaHandleInput, setInstaHandleInput] = useState("");
  const [isImportingInsta, setIsImportingInsta] = useState(false);
  const [instaFeedback, setInstaFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Store fields
  const [name, setName] = useState(contextStore?.name || "");
  const [slug, setSlug] = useState(contextStore?.slug || "");
  const [description, setDescription] = useState(contextStore?.description || "");
  const [logoUrl, setLogoUrl] = useState(contextStore?.logo_url || "");
  const [whatsapp, setWhatsapp] = useState(contextStore?.whatsapp || "");
  const [instagram, setInstagram] = useState(contextStore?.instagram || "");
  const [facebook, setFacebook] = useState(contextStore?.facebook || "");
  const [city, setCity] = useState(contextStore?.city || "");

  // Billing state
  const [billing, setBilling] = useState<StoreBillingInfo>({ bank_accounts: [], digital_wallets: [] });
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // New wallet / bank form state
  const [newWallet, setNewWallet] = useState<Partial<DigitalWallet>>({ platform: "Yape", phone: "", holder_name: "", qr_url: null });
  const [newBank, setNewBank] = useState<Partial<BankAccount>>({ bank: "BCP", account_type: "Ahorros", account_number: "", cci: "", holder_name: "" });
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);

  const currentPlan = store?.plan || "starter";

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const currentStore = contextStore || (await getCurrentStore());
      setStore(currentStore);
      if (currentStore) {
        setName(currentStore.name || "");
        setSlug(currentStore.slug || "");
        setDescription(currentStore.description || "");
        setLogoUrl(currentStore.logo_url || "");
        setWhatsapp(currentStore.whatsapp || "");
        setInstagram(currentStore.instagram || "");
        setFacebook(currentStore.facebook || "");
        setCity(currentStore.city || "");

        const b = await getStoreBilling(currentStore.id);
        setBilling(b);
      }
      setLoading(false);
    }
    loadSettings();
  }, [contextStore?.id]);

  const handleImportInstagram = async (overrideUser?: string) => {
    const rawTarget = (overrideUser || instaHandleInput || instagram).trim();
    if (!rawTarget) {
      setInstaFeedback({ type: "error", message: "Por favor ingresa un nombre de usuario de Instagram (ej. @mitienda)" });
      return;
    }
    setIsImportingInsta(true);
    setInstaFeedback(null);
    try {
      const res = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: rawTarget }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "No se pudieron extraer los datos de la cuenta.");
      const { data } = result;
      if (data.name) setName(data.name);
      if (!slug || slug.trim() === "") setSlug(slugify(data.name || data.username));
      if (data.description) setDescription(data.description);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.whatsapp) setWhatsapp(data.whatsapp);
      if (data.city) setCity(data.city);
      if (data.instagram) { setInstagram(data.instagram); setInstaHandleInput(data.instagram); }
      const summaryList = [];
      if (data.name) summaryList.push("Nombre");
      if (data.description) summaryList.push("Biografía");
      if (data.logoUrl) summaryList.push("Logo");
      if (data.whatsapp) summaryList.push("WhatsApp");
      if (data.city) summaryList.push("Ciudad");
      setInstaFeedback({ type: "success", message: `¡Perfil @${data.username} importado con éxito! Se cargaron: ${summaryList.join(", ")}. Recuerda hacer clic en "Guardar Datos" para guardar.` });
    } catch (err: any) {
      setInstaFeedback({ type: "error", message: err.message || "Error al conectar con Instagram." });
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
        if (!name.trim()) { setErrorMessage("Por favor, ingresa el nombre de tu tienda."); return; }
        if (!whatsapp.trim()) { setErrorMessage("Por favor, ingresa el número de WhatsApp."); return; }
        const created = await createStore({ name: name.trim(), slug: slugify(slug.trim() || name.trim() || "mi-tienda"), description: description.trim() || null, logo_url: logoUrl.trim() || null, whatsapp: whatsapp.trim(), instagram: instagram.trim() || null, facebook: facebook.trim() || null, city: city.trim() || null, plan: currentPlan });
        if (created) { setStore(created); updateStoreLocally(created); refreshStore(); setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 2500); }
        else setErrorMessage("Error al crear la tienda. Por favor verifica los datos.");
        return;
      }
      const updated = await updateStore(store.id, { name: name.trim(), slug: slugify(slug.trim() || name.trim()), description: description.trim(), logo_url: logoUrl.trim() || null, whatsapp: whatsapp.trim(), instagram: instagram.trim() || null, facebook: facebook.trim() || null, city: city.trim() || null });
      if (updated) { setStore(updated); updateStoreLocally(updated); refreshStore(); setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 2500); }
      else setErrorMessage("Error al actualizar la tienda. Por favor intenta de nuevo.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Error inesperado al conectar con la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── BILLING HANDLERS ────────────────────────────────────────────────────────

  const handleSaveBilling = async () => {
    if (!store) return;
    setIsSavingBilling(true);
    const ok = await updateStoreBilling(store.id, billing);
    if (ok) { setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 2500); }
    setIsSavingBilling(false);
  };

  const handleAddWallet = async () => {
    if (!newWallet.phone?.trim() || !newWallet.holder_name?.trim()) return;
    const wallet: DigitalWallet = {
      id: generateId(),
      platform: (newWallet.platform as "Yape" | "Plin") || "Yape",
      phone: newWallet.phone!.trim(),
      holder_name: newWallet.holder_name!.trim(),
      qr_url: newWallet.qr_url || null,
    };
    const updated = { ...billing, digital_wallets: [...billing.digital_wallets, wallet] };
    setBilling(updated);
    setNewWallet({ platform: "Yape", phone: "", holder_name: "", qr_url: null });
    setShowWalletForm(false);

    if (store) {
      await updateStoreBilling(store.id, updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleRemoveWallet = async (id: string) => {
    const updated = { ...billing, digital_wallets: billing.digital_wallets.filter((w) => w.id !== id) };
    setBilling(updated);
    if (store) {
      await updateStoreBilling(store.id, updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleAddBank = async () => {
    if (!newBank.account_number?.trim() || !newBank.holder_name?.trim()) return;
    const bank: BankAccount = {
      id: generateId(),
      bank: newBank.bank || "BCP",
      account_type: (newBank.account_type as "Ahorros" | "Corriente") || "Ahorros",
      account_number: newBank.account_number!.trim(),
      cci: newBank.cci?.trim() || "",
      holder_name: newBank.holder_name!.trim(),
    };
    const updated = { ...billing, bank_accounts: [...billing.bank_accounts, bank] };
    setBilling(updated);
    setNewBank({ bank: "BCP", account_type: "Ahorros", account_number: "", cci: "", holder_name: "" });
    setShowBankForm(false);

    if (store) {
      await updateStoreBilling(store.id, updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleRemoveBank = async (id: string) => {
    const updated = { ...billing, bank_accounts: billing.bank_accounts.filter((b) => b.id !== id) };
    setBilling(updated);
    if (store) {
      await updateStoreBilling(store.id, updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
            Configuración de la Tienda
          </h1>
          <p style={{ color: "var(--color-mid-gray)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Personaliza la identidad, enlaces y métodos de cobro de tu tienda online.
          </p>
        </div>

        {savedSuccess && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", border: "1px solid var(--color-hairline)", padding: "0.4rem 0.85rem", borderRadius: "18px", fontSize: "0.8125rem", fontWeight: 500 }}>
            <Check size={14} /> Cambios guardados
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button onClick={() => setActiveTab("store")} className={`btn btn--sm ${activeTab === "store" ? "btn--primary" : "btn--secondary"}`}>
          Datos de la Tienda
        </button>
        <button onClick={() => setActiveTab("billing")} className={`btn btn--sm ${activeTab === "billing" ? "btn--primary" : "btn--secondary"}`}>
          Datos de Pago
        </button>
      </div>

      {errorMessage && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)", padding: "0.75rem 1rem", borderRadius: "14px", marginBottom: "1.25rem", fontSize: "0.875rem", maxWidth: "640px" }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── TAB 1: DATOS DE TIENDA ── */}
      {activeTab === "store" && (
        <div className={styles.panel} style={{ maxWidth: "1440px" }}>
          <div className={styles.panel__header}>
            <h2>{store ? "Información pública" : "Crear mi Tienda Online"}</h2>
          </div>
          <div className={styles.panel__body}>
            {!store && (
              <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "0.75rem 1rem", borderRadius: "14px", marginBottom: "1.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} />
                <span>Aún no tienes una tienda registrada. Ingresa tus datos aquí y haz clic en <strong>Crear mi Tienda</strong> para comenzar.</span>
              </div>
            )}

            {/* INSTAGRAM FAST IMPORT */}
            <div style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", borderRadius: "16px", padding: "1.15rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.4rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--color-ink)", color: "var(--color-paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Instagram size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-ink)", margin: 0 }}>Importar detalles desde Instagram</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-mid-gray)", margin: 0 }}>Autocompleta nombre, bio, logo, WhatsApp y ciudad con tu @usuario.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", alignItems: "center" }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. @mitienda o enlace de perfil"
                  value={instaHandleInput}
                  onChange={(e) => setInstaHandleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleImportInstagram(); } }}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn--secondary" onClick={() => handleImportInstagram()} disabled={isImportingInsta} style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {isImportingInsta ? <><Loader2 size={15} className="spin" /><span>Importando...</span></> : <><Sparkles size={15} /><span>Importar</span></>}
                </button>
              </div>
              {instaFeedback && (
                <div style={{ marginTop: "0.85rem", padding: "0.65rem 0.85rem", borderRadius: "10px", fontSize: "0.8125rem", display: "flex", alignItems: "flex-start", gap: "0.5rem", backgroundColor: instaFeedback.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", color: instaFeedback.type === "success" ? "#16a34a" : "#ef4444", border: `1px solid ${instaFeedback.type === "success" ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}` }}>
                  {instaFeedback.type === "success" ? <Check size={16} style={{ marginTop: "2px", flexShrink: 0 }} /> : <AlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />}
                  <span>{instaFeedback.message}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveStore}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem", marginTop: "0.85rem", alignItems: "start" }}>
                <div className="form-group">
                  <label>Nombre de la tienda *</label>
                  <input type="text" className="input" placeholder="Ej. Lima Trends" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>URL personalizada (slug)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#64748B" }}>klik.sale/</span>
                    <input type="text" className="input" placeholder="lima-trends" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input type="text" className="input" placeholder="Lima, Arequipa..." value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "0.85rem", alignItems: "start" }}>
                <div className="form-group">
                  <label>WhatsApp de Ventas *</label>
                  <input type="tel" className="input" placeholder="+51 999 888 777" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                  <span className="helper-text">Los compradores enviarán sus pedidos directamente a este número.</span>
                </div>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ margin: 0 }}>Instagram (@usuario)</label>
                    {instagram && (
                      <button type="button" onClick={() => handleImportInstagram(instagram)} disabled={isImportingInsta} style={{ background: "none", border: "none", color: "var(--color-ink)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0, textDecoration: "underline" }}>
                        {isImportingInsta ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />} Sincronizar
                      </button>
                    )}
                  </div>
                  <input type="text" className="input" placeholder="@mitienda" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción / Bio</label>
                <textarea className="textarea" placeholder="Describe brevemente tus productos y envíos" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <ImageUpload label="Foto de Perfil / Logo de la Tienda" value={logoUrl} onChange={setLogoUrl} folder="stores" helperText="Se muestra en la parte superior de tu catálogo público." placeholderText="Arrastra o sube el logo de tu tienda" />
              <button type="submit" className="btn btn--primary" style={{ marginTop: "1rem" }} disabled={isSaving}>
                {isSaving ? <><Loader2 size={16} className="spin" /> Guardando datos...</> : <><Save size={16} /> {store ? "Guardar Datos" : "Crear mi Tienda"}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 2: PLAN Y COBROS ── */}
      {activeTab === "billing" && (
        <div style={{ maxWidth: "1440px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Suscripción Klik */}
          <div className={styles.panel}>
            <div className={styles.panel__header}>
              <h2>Tu Suscripción Klik</h2>
            </div>
            <div className={styles.panel__body}>
              {store?.is_active === false ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1.25rem",
                    padding: "1rem 1.25rem",
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        backgroundColor: "#fff7ed",
                        color: "#c2410c",
                        border: "1px solid rgba(234, 88, 12, 0.3)",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "20px",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                      }}
                    >
                      ● Inactivo / Pendiente de Pago
                    </div>
                    <span style={{ fontSize: "0.875rem", color: "#b45309" }}>
                      Activa tu suscripción para habilitar tu catálogo y ventas
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/51906013310?text=${encodeURIComponent(
                      `Hola KUBOstudio, solicito activar la suscripción para mi tienda ${store?.name || name} (slug: ${store?.slug || slug})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary btn--sm"
                    style={{
                      textDecoration: "none",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <MessageCircle size={15} /> Activar suscripción
                  </a>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.25)", padding: "0.4rem 0.85rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.9375rem" }}>
                    <Check size={15} /> Activo
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-mid-gray)" }}>Plan Klik — sin interrupciones</span>
                </div>
              )}
              <div style={{ padding: "1.25rem", backgroundColor: "var(--color-surface-alt)", border: "1px solid var(--color-hairline)", borderRadius: "16px" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.65rem", color: "var(--color-ink)" }}>
                  Beneficios incluidos en tu Plan Klik:
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8125rem", color: "var(--color-mid-gray)", lineHeight: 1.8 }}>
                  <li>Productos ilimitados con fotos y carrusel interactivo</li>
                  <li>0% comisiones sobre ventas</li>
                  <li>Control de stock por producto con alertas de bajo stock</li>
                  <li>Configuración de métodos de cobro: Yape, Plin y transferencias bancarias</li>
                  <li>Seguimiento de compradores</li>
                  <li>Soporte y atención directa por WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Métodos de Cobro — Billeteras Digitales */}
          <div className={styles.panel}>
            <div className={styles.panel__header}>
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Smartphone size={18} /> Yape y Plin
                </h2>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setShowWalletForm(!showWalletForm)}
                >
                  <Plus size={15} /> Agregar
                </button>
              </div>
            </div>
            <div className={styles.panel__body}>
              {/* List existing wallets */}
              {billing.digital_wallets.length === 0 && !showWalletForm && (
                <p style={{ fontSize: "0.875rem", color: "var(--color-mid-gray)" }}>
                  No tienes billeteras digitales configuradas. Agrega Yape o Plin para que tus clientes puedan pagarte.
                </p>
              )}

              {billing.digital_wallets.map((wallet) => (
                <div key={wallet.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", backgroundColor: "var(--color-surface-alt)", border: "1px solid var(--color-hairline)", borderRadius: "12px", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {wallet.qr_url ? (
                      <img
                        src={wallet.qr_url}
                        alt={`QR ${wallet.platform}`}
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "contain",
                          borderRadius: "8px",
                          border: "1px solid var(--color-hairline)",
                          backgroundColor: "#ffffff",
                          padding: "2px",
                        }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: "10px", background: wallet.platform === "Yape" ? "#6c0ed9" : "#00b8d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Smartphone size={20} color="white" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{wallet.platform}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-mid-gray)" }}>{wallet.phone} · {wallet.holder_name}</div>
                      {wallet.qr_url ? (
                        <div style={{ fontSize: "0.75rem", color: "#16a34a", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.15rem", fontWeight: 600 }}>
                          <QrCode size={12} /> Imagen de código QR lista para checkout
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.75rem", color: "#ca8a04", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.15rem" }}>
                          Sin imagen QR (solo número)
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveWallet(wallet.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-mid-gray)", padding: "0.4rem" }} title="Eliminar billetera">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Add wallet form */}
              {showWalletForm && (
                <div style={{ padding: "1.25rem", backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", borderRadius: "14px", marginTop: "0.5rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "1rem" }}>Nueva billetera digital</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Plataforma</label>
                      <select className="input" value={newWallet.platform} onChange={(e) => setNewWallet((p) => ({ ...p, platform: e.target.value as "Yape" | "Plin" }))}>
                        <option>Yape</option>
                        <option>Plin</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Número de teléfono</label>
                      <input type="tel" className="input" placeholder="987 654 321" value={newWallet.phone || ""} onChange={(e) => setNewWallet((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label>Nombre del titular</label>
                    <input type="text" className="input" placeholder="Ej. María García" value={newWallet.holder_name || ""} onChange={(e) => setNewWallet((p) => ({ ...p, holder_name: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.4rem" }}>
                      Subir imagen del código QR ({newWallet.platform || "Yape / Plin"})
                    </label>
                    <ImageUpload
                      value={newWallet.qr_url || ""}
                      onChange={(url) => setNewWallet((p) => ({ ...p, qr_url: url }))}
                      folder="stores"
                      helperText="Sube la captura o foto del código QR de tu cuenta para que los clientes lo escaneen directamente en el checkout."
                      placeholderText="Arrastra la imagen del código QR o haz clic para subirla"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" className="btn btn--primary btn--sm" onClick={handleAddWallet}><Check size={14} /> Agregar</button>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowWalletForm(false)}><X size={14} /> Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Métodos de Cobro — Cuentas Bancarias */}
          <div className={styles.panel}>
            <div className={styles.panel__header}>
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Building2 size={18} /> Cuentas Bancarias
                </h2>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowBankForm(!showBankForm)}>
                  <Plus size={15} /> Agregar
                </button>
              </div>
            </div>
            <div className={styles.panel__body}>
              {billing.bank_accounts.length === 0 && !showBankForm && (
                <p style={{ fontSize: "0.875rem", color: "var(--color-mid-gray)" }}>
                  No tienes cuentas bancarias configuradas. Agrega una cuenta para que tus clientes puedan hacer transferencias.
                </p>
              )}

              {billing.bank_accounts.map((bank) => (
                <div key={bank.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", backgroundColor: "var(--color-surface-alt)", border: "1px solid var(--color-hairline)", borderRadius: "12px", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={17} color="white" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{bank.bank}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-mid-gray)" }}>{bank.account_type} · {bank.holder_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-mid-gray)", fontFamily: "monospace" }}>N° {bank.account_number}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveBank(bank.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-mid-gray)", padding: "0.25rem" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Add bank form */}
              {showBankForm && (
                <div style={{ padding: "1.25rem", backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", borderRadius: "14px", marginTop: "0.5rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "1rem" }}>Nueva cuenta bancaria</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Banco</label>
                      <select className="input" value={newBank.bank} onChange={(e) => setNewBank((p) => ({ ...p, bank: e.target.value }))}>
                        {BANKS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Tipo de cuenta</label>
                      <select className="input" value={newBank.account_type} onChange={(e) => setNewBank((p) => ({ ...p, account_type: e.target.value as "Ahorros" | "Corriente" }))}>
                        <option>Ahorros</option>
                        <option>Corriente</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label>Nombre del titular</label>
                    <input type="text" className="input" placeholder="Ej. María García" value={newBank.holder_name || ""} onChange={(e) => setNewBank((p) => ({ ...p, holder_name: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label>Número de cuenta</label>
                    <input type="text" className="input" placeholder="Ej. 194-123456789-0-01" value={newBank.account_number || ""} onChange={(e) => setNewBank((p) => ({ ...p, account_number: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label>CCI (Código de Cuenta Interbancario)</label>
                    <input type="text" className="input" placeholder="Ej. 002-194-001234567890-12" value={newBank.cci || ""} onChange={(e) => setNewBank((p) => ({ ...p, cci: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" className="btn btn--primary btn--sm" onClick={handleAddBank}><Check size={14} /> Agregar</button>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowBankForm(false)}><X size={14} /> Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save billing */}
          {(billing.bank_accounts.length > 0 || billing.digital_wallets.length > 0) && (
            <button type="button" className="btn btn--primary" onClick={handleSaveBilling} disabled={isSavingBilling} style={{ alignSelf: "flex-start" }}>
              {isSavingBilling ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar métodos de cobro</>}
            </button>
          )}
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
