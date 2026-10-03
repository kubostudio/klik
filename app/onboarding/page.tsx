"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/styles/modules/onboarding.module.scss";
import { slugify, formatCurrency } from "@/lib/utils";
import { createStore, createProduct } from "@/lib/supabase/db";
import {
  isValidEmail,
  isValidInstagram,
  sanitizeStoreName,
  sanitizeInstagram,
  sanitizeEmail,
} from "@/lib/security/sanitize";
import ImageUpload from "@/components/ui/ImageUpload";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import {
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Store,
  Sparkles,
  Loader2,
  AlertCircle,
  Instagram,
} from "lucide-react";
import confetti from "canvas-confetti";
import Logo from "@/components/ui/Logo";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Instagram fast import state
  const [instaInput, setInstaInput] = useState("");
  const [isImportingInsta, setIsImportingInsta] = useState(false);
  const [instaSuccessMsg, setInstaSuccessMsg] = useState<string | null>(null);

  // Paso 1: Info básica
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeNiche, setStoreNiche] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Cargar correo si el usuario se registró previamente en esta sesión
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionStr = localStorage.getItem("klik_seller_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session.email) {
            setStoreEmail(session.email);
          }
        } catch {}
      }
    }
  }, []);

  // Paso 2: Personalización
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  // Paso 3: Primer producto
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantSizes, setVariantSizes] = useState("");
  const [variantColors, setVariantColors] = useState("");

  // Paso 4: Finalizado
  const [isPublished, setIsPublished] = useState(false);

  const storeSlug = slugify(storeName || "mi-tienda");

  const handleImportInstagram = async () => {
    if (!instaInput.trim()) {
      setErrorMessage("Ingresa tu usuario de Instagram para importar.");
      return;
    }

    setIsImportingInsta(true);
    setErrorMessage(null);
    setInstaSuccessMsg(null);

    try {
      const res = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: instaInput.trim() }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(
          result.error || "No pudimos obtener los datos de tu cuenta.",
        );
      }

      const { data } = result;
      if (data.name) setStoreName(data.name);
      if (data.description) setDescription(data.description);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.whatsapp) setWhatsapp(data.whatsapp);
      if (data.city) setCity(data.city);
      if (data.instagram) setInstagram(data.instagram);

      const items = [];
      if (data.name) items.push("nombre");
      if (data.description) items.push("bio");
      if (data.logoUrl) items.push("logo");
      if (data.whatsapp) items.push("WhatsApp");
      if (data.city) items.push("ciudad");

      setInstaSuccessMsg(
        `¡Detalles de @${data.username} importados con éxito! (${items.join(", ")}).`,
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Error al importar desde Instagram.");
    } finally {
      setIsImportingInsta(false);
    }
  };

  const handleNext = async () => {
    setErrorMessage(null);

    if (step === 1) {
      if (!storeName.trim()) {
        setErrorMessage("Por favor, ingresa el nombre de tu tienda.");
        return;
      }
      if (!storeEmail.trim()) {
        setErrorMessage(
          "Por favor, ingresa el correo de contacto para tu tienda.",
        );
        return;
      }
      if (!isValidEmail(storeEmail.trim())) {
        setErrorMessage(
          "El correo ingresado no tiene un formato válido (ej. tienda@correo.com).",
        );
        return;
      }
      if (!whatsapp.trim()) {
        setErrorMessage(
          "Por favor, ingresa el número de WhatsApp donde recibirás tus pedidos.",
        );
        return;
      }

      // Validación de unicidad de nombre, slug y correo
      setIsValidating(true);
      try {
        const res = await fetch("/api/stores/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: storeName.trim(),
            slug: storeSlug,
            email: storeEmail.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.available) {
          setErrorMessage(
            data.message ||
              data.error ||
              "El nombre o correo ya se encuentra en uso.",
          );
          return;
        }
      } catch (err: any) {
        console.error("Error in store validation:", err);
      } finally {
        setIsValidating(false);
      }
    }

    if (step === 2) {
      if (instagram.trim()) {
        if (!isValidInstagram(instagram.trim())) {
          setErrorMessage(
            "El usuario de Instagram solo puede contener letras, números, puntos y guiones bajos (máx. 30 caracteres).",
          );
          return;
        }

        // Validación de unicidad de usuario de Instagram
        setIsValidating(true);
        try {
          const res = await fetch("/api/stores/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instagram: instagram.trim(),
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.available) {
            setErrorMessage(
              data.message ||
                data.error ||
                "El usuario de Instagram ya está en uso.",
            );
            return;
          }
        } catch (err: any) {
          console.error("Error validating instagram:", err);
        } finally {
          setIsValidating(false);
        }
      }
    }

    if (step === 3) {
      if (!productName.trim()) {
        setErrorMessage("Por favor, ingresa el nombre de tu primer producto.");
        return;
      }
      if (
        !productPrice.trim() ||
        isNaN(parseFloat(productPrice)) ||
        parseFloat(productPrice) <= 0
      ) {
        setErrorMessage("Por favor, ingresa un precio válido mayor a 0.");
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePublish = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Guardar tienda en Supabase con sanitización y email
      const newStore = await createStore({
        name: storeName.trim(),
        slug: storeSlug,
        email: storeEmail.trim() || null,
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        city: city.trim() || null,
        plan: "starter",
      });

      if (!newStore) {
        throw new Error(
          "No se pudo crear la tienda. Por favor revisa los datos e inténtalo de nuevo.",
        );
      }

      // 2. Preparar variantes para el producto
      const variantsList: Array<{ name: string; value: string }> = [];
      if (hasVariants) {
        if (variantSizes.trim()) {
          variantSizes.split(",").forEach((val) => {
            if (val.trim()) {
              variantsList.push({
                name: "Talla",
                value: val.trim(),
              });
            }
          });
        }
        if (variantColors.trim()) {
          variantColors.split(",").forEach((val) => {
            if (val.trim()) {
              variantsList.push({
                name: "Color",
                value: val.trim(),
              });
            }
          });
        }
      }

      // 3. Guardar primer producto
      const mainProdImage = productImages[0] || null;
      const additionalProdImages = productImages.slice(1);

      await createProduct(
        {
          store_id: newStore.id,
          name: productName.trim(),
          slug: slugify(productName.trim()),
          description: productDescription.trim() || null,
          price: parseFloat(productPrice) || 0,
          image_url: mainProdImage,
          category: productCategory.trim() || "General",
          brand: productBrand.trim() || null,
          active: true,
        },
        variantsList,
        additionalProdImages,
      );

      setIsPublished(true);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignorar si canvas no está disponible
      }
    } catch (err: any) {
      console.error("Error publishing store:", err);
      setErrorMessage(
        err?.message || "Ocurrió un error al procesar la solicitud.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `https://klik.business/${storeSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.header__inner}>
          <Link href="/" className={styles.logo}>
            <Logo size={36} color="#ffffff" />
          </Link>
          <div className={styles.stepIndicator}>Paso {step} de 4</div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div
              className={`${styles.segment} ${
                step >= 1
                  ? step === 1
                    ? styles["segment--active"]
                    : styles["segment--completed"]
                  : ""
              }`}
            />
            <div
              className={`${styles.segment} ${
                step >= 2
                  ? step === 2
                    ? styles["segment--active"]
                    : styles["segment--completed"]
                  : ""
              }`}
            />
            <div
              className={`${styles.segment} ${
                step >= 3
                  ? step === 3
                    ? styles["segment--active"]
                    : styles["segment--completed"]
                  : ""
              }`}
            />
            <div
              className={`${styles.segment} ${
                step >= 4
                  ? step === 4
                    ? styles["segment--active"]
                    : styles["segment--completed"]
                  : ""
              }`}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "0.75rem 1rem",
                borderRadius: "14px",
                marginBottom: "1.25rem",
                fontSize: "0.875rem",
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isPublished ? (
            <>
              {/* PASO 1: INFORMACIÓN BÁSICA */}
              {step === 1 && (
                <div>
                  <div className={styles.card__header}>
                    <h1>Información básica de tu tienda</h1>
                    <p>
                      Cuéntanos un poco sobre tu negocio para preparar tu
                      catálogo.
                    </p>
                  </div>

                  {/* INSTAGRAM FAST IMPORT SHORTCUT */}
                  <div
                    style={{
                      backgroundColor: "var(--color-canvas)",
                      border: "1px solid var(--color-hairline)",
                      borderRadius: "16px",
                      padding: "0.85rem 1rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        marginBottom: "0.45rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.45rem",
                        }}
                      >
                        <Instagram size={15} />
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--color-ink)",
                          }}
                        >
                          ¿Tienes Instagram para tu tienda?
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          color: "var(--color-mid-gray)",
                        }}
                      >
                        Autocompletar
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="@tu_tienda (importar datos)"
                        value={instaInput}
                        onChange={(e) => setInstaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImportInstagram();
                          }
                        }}
                        style={{
                          fontSize: "0.8125rem",
                          padding: "0.45rem 0.75rem",
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={handleImportInstagram}
                        disabled={isImportingInsta}
                        style={{
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        {isImportingInsta ? (
                          <>
                            <Loader2 size={13} className="spin" />
                            <span>Importando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Importar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {instaSuccessMsg && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.75rem",
                          color: "#4ade80",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <Check size={13} />
                        <span>{instaSuccessMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="storeName">Nombre de tu tienda *</label>
                    <input
                      id="storeName"
                      type="text"
                      className="input"
                      placeholder="Ej. Lima Trends, Moda Urbana"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                    {storeName.trim() && (
                      <span className="helper-text">
                        Tu link será: <strong>klik.business/{storeSlug}</strong>
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="storeEmail">
                      Correo electrónico de contacto *
                    </label>
                    <input
                      id="storeEmail"
                      type="email"
                      className="input"
                      placeholder="contacto@mitienda.pe"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      required
                    />
                    <span className="helper-text">
                      Será único para tu tienda y se usará para notificaciones
                      de seguridad.
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="storeNiche">¿Qué vendes?</label>
                    <input
                      id="storeNiche"
                      type="text"
                      className="input"
                      placeholder="Ej. Ropa femenina, Calzado urbano, Joyería"
                      value={storeNiche}
                      onChange={(e) => setStoreNiche(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">Ciudad / Ubicación</label>
                    <input
                      id="city"
                      type="text"
                      className="input"
                      placeholder="Ej. Lima, Arequipa, Trujillo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp">
                      WhatsApp donde recibirás los pedidos *
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      className="input"
                      placeholder="+51 999 888 777"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      required
                    />
                    <span className="helper-text">
                      Aquí llegarán tus clientes con el pedido listo para
                      coordinar el pago.
                    </span>
                  </div>
                </div>
              )}

              {/* PASO 2: PERSONALIZACIÓN */}
              {step === 2 && (
                <div>
                  <div className={styles.card__header}>
                    <h1>Personaliza la apariencia</h1>
                    <p>
                      Agrega los detalles que verán tus clientes al abrir tu
                      link.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Descripción breve o bio</label>
                    <textarea
                      id="description"
                      className="textarea"
                      placeholder="Ej. Ropa urbana y accesorios. Envíos a todo el Perú."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <ImageUpload
                    label="Foto o Logo de la tienda"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    folder="stores"
                    helperText="Aparecerá en la cabecera de tu catálogo público."
                    placeholderText="Arrastra el logo de tu tienda o haz clic para subirlo"
                  />

                  <div className="form-group">
                    <label htmlFor="instagram">Usuario de Instagram</label>
                    <input
                      id="instagram"
                      type="text"
                      className="input"
                      placeholder="@mitienda"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="facebook">
                      Página de Facebook (opcional)
                    </label>
                    <input
                      id="facebook"
                      type="text"
                      className="input"
                      placeholder="facebook.com/mitienda"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* PASO 3: PRIMER PRODUCTO */}
              {step === 3 && (
                <div>
                  <div className={styles.card__header}>
                    <h1>Crea tu primer producto</h1>
                    <p>
                      Agrega un artículo para que tu tienda esté lista para
                      vender.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="productName">Nombre del producto *</label>
                    <input
                      id="productName"
                      type="text"
                      className="input"
                      placeholder="Ej. Polo Básico Pima"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div className="form-group">
                      <label htmlFor="productPrice">Precio (S/) *</label>
                      <input
                        id="productPrice"
                        type="number"
                        step="0.5"
                        min="0"
                        className="input"
                        placeholder="0.00"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="productCategory">Categoría</label>
                      <input
                        id="productCategory"
                        type="text"
                        className="input"
                        placeholder="Ej. Polos, Joyas"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="productBrand">Marca (opcional)</label>
                      <input
                        id="productBrand"
                        type="text"
                        className="input"
                        placeholder="Ej. Nike, Klik"
                        value={productBrand}
                        onChange={(e) => setProductBrand(e.target.value)}
                      />
                    </div>
                  </div>

                  <MultiImageUpload
                    label="Fotos del Producto"
                    images={productImages}
                    onChange={setProductImages}
                    maxImages={6}
                    folder="products"
                    helperText="Los clientes compran más rápido cuando ven fotos claras del artículo. Si subes más de una, se creará un carrusel interactivo en tu tienda."
                  />

                  <div className="form-group">
                    <label htmlFor="productDescription">Descripción</label>
                    <textarea
                      id="productDescription"
                      className="textarea"
                      placeholder="Describe material, tallas o detalles importantes"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                    />
                  </div>

                  {/* Variantes Opcionales */}
                  <div
                    style={{
                      borderTop: "1px solid var(--color-hairline)",
                      paddingTop: "1rem",
                      marginTop: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <input
                        id="hasVariants"
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        htmlFor="hasVariants"
                        style={{ fontWeight: 500, cursor: "pointer" }}
                      >
                        ¿Este producto tiene variantes? (Tallas, Colores, etc.)
                      </label>
                    </div>

                    {hasVariants && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor="variantSizes">
                            Tallas (separadas por coma)
                          </label>
                          <input
                            id="variantSizes"
                            type="text"
                            className="input"
                            placeholder="S, M, L, XL"
                            value={variantSizes}
                            onChange={(e) => setVariantSizes(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="variantColors">
                            Colores (separados por coma)
                          </label>
                          <input
                            id="variantColors"
                            type="text"
                            className="input"
                            placeholder="Negro, Blanco, Azul"
                            value={variantColors}
                            onChange={(e) => setVariantColors(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 4: PREVIEW Y PUBLICAR */}
              {step === 4 && (
                <div>
                  <div className={styles.card__header}>
                    <h1>¡Casi listo! Revisa tu tienda</h1>
                    <p>
                      Así es como se verá tu catálogo ante tus clientes de redes
                      sociales.
                    </p>
                  </div>

                  <div className={styles.previewBox}>
                    <div className={styles.previewStoreHeader}>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={storeName || "Tienda"}
                          className={styles.avatar}
                        />
                      ) : (
                        <div
                          className={styles.avatar}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#1e1e1e",
                            color: "#a3a3a3",
                            border: "1px solid #333333",
                          }}
                        >
                          <Store size={24} />
                        </div>
                      )}
                      <div className={styles.info}>
                        <h3>{storeName || "Nombre de tu tienda"}</h3>
                        <p>{description || "Sin descripción aún"}</p>
                      </div>
                    </div>

                    <div className={styles.previewProductCard}>
                      {productImages.length > 0 ? (
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "140px",
                          }}
                        >
                          <img
                            src={productImages[0]}
                            alt={productName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {productImages.length > 1 && (
                            <span
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                backgroundColor: "rgba(15, 23, 42, 0.7)",
                                color: "#FFFFFF",
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              +{productImages.length - 1} fotos
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            height: "140px",
                            backgroundColor: "#1e1e1e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#888888",
                            fontSize: "0.875rem",
                          }}
                        >
                          Sin foto
                        </div>
                      )}
                      <div className={styles.prodInfo}>
                        <div className={styles.cat}>
                          {productCategory || "General"}
                        </div>
                        <h4>{productName || "Producto de ejemplo"}</h4>
                        <div className={styles.price}>
                          {formatCurrency(parseFloat(productPrice) || 0)}
                        </div>
                        {hasVariants && (variantSizes || variantColors) && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-mid-gray)",
                              marginTop: "0.25rem",
                            }}
                          >
                            {variantSizes && `Tallas: ${variantSizes}`}
                            {variantSizes && variantColors && " | "}
                            {variantColors && `Colores: ${variantColors}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className={styles.actions}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn--secondary"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={16} /> Anterior
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn--primary"
                    disabled={isValidating || isSubmitting}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 size={16} className="spin" /> Verificando
                        disponibilidad...
                      </>
                    ) : (
                      <>
                        Siguiente <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="btn btn--primary btn--lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="spin" /> Publicando tu
                        tienda...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> Publicar mi tienda
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* SUCCESS STATE */
            <div className={styles.successBox}>
              <div className={styles.icon}>
                <Check size={36} />
              </div>

              <h2>¡Tu tienda está lista! 🎉</h2>
              <p>
                Tu tienda y tu producto han sido registrados con éxito. Ya
                puedes compartir tu enlace en tu biografía de Instagram, TikTok
                y WhatsApp.
              </p>

              <div className={styles.urlBox}>
                <code>https://klik.business/{storeSlug}</code>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn--secondary btn--sm"
                >
                  {copied ? (
                    <>
                      <Check size={14} /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copiar link
                    </>
                  )}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Link
                  href={`/${storeSlug}`}
                  target="_blank"
                  className="btn btn--primary btn--full btn--lg"
                >
                  <ExternalLink size={18} /> Ver mi tienda pública
                </Link>

                <Link
                  href="/dashboard"
                  className="btn btn--secondary btn--full"
                >
                  <Store size={18} /> Ir a mi Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
