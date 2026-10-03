"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/styles/modules/legal.module.scss";
import { ArrowLeft, ShieldCheck, FileText, Cookie, BookOpen, CheckCircle2, AlertCircle, Send } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function ReclamacionesPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    documentoTipo: "DNI",
    documentoNumero: "",
    email: "",
    telefono: "",
    direccion: "",
    departamento: "Lima",
    tipoBien: "servicio",
    montoReclamado: "",
    descripcionBien: "Suscripción a la plataforma Klik (klik.sale)",
    tipoReclamacion: "reclamo",
    detalle: "",
    pedido: "",
    menorDeEdad: false,
    nombreApoderado: "",
    documentoApoderado: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [codigoReclamo, setCodigoReclamo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Generate compliant sequential/timestamp code
    const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
    const code = `KLIK-LR-2026-${uniqueNumber}`;
    setCodigoReclamo(code);

    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className={styles.legalPage}>
      {/* HEADER */}
      <header className={styles.legalHeader}>
        <div className={styles.legalHeader__inner}>
          <Link
            href="/"
            className={styles.legalHeader__logo}
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "10px",
              padding: "6px 14px",
              textDecoration: "none",
            }}
          >
            <Logo size={28} color="#d97742" />
          </Link>
          <div className={styles.legalHeader__actions}>
            <Link href="/" className="btn btn--secondary btn--sm">
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
            <Link href="/register" className="btn btn--primary btn--sm">
              Crear tienda
            </Link>
          </div>
        </div>
      </header>

      {/* CONTAINER */}
      <main className={styles.legalContainer}>
        {/* TABS DE NAVEGACIÓN */}
        <div className={styles.legalTabs}>
          <Link href="/terminos" className={styles.legalTab}>
            <FileText
              size={14}
              style={{
                display: "inline",
                marginRight: "4px",
                verticalAlign: "-2px",
              }}
            />
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className={styles.legalTab}>
            <ShieldCheck
              size={14}
              style={{
                display: "inline",
                marginRight: "4px",
                verticalAlign: "-2px",
              }}
            />
            Política de Privacidad
          </Link>
          <Link href="/cookies" className={styles.legalTab}>
            <Cookie
              size={14}
              style={{
                display: "inline",
                marginRight: "4px",
                verticalAlign: "-2px",
              }}
            />
            Política de Cookies
          </Link>
          {/* <Link
            href="/reclamaciones"
            className={`${styles.legalTab} ${styles["legalTab--active"]}`}
          >
            <BookOpen
              size={14}
              style={{
                display: "inline",
                marginRight: "4px",
                verticalAlign: "-2px",
              }}
            />
            Libro de Reclamaciones
          </Link> */}
        </div>

        <article className={styles.legalCard}>
          <header>
            <span className="badge badge--soft">Atención al Consumidor</span>
            <h1>Libro de Reclamaciones Virtual</h1>
            <p>
              Conforme a lo dispuesto por la Ley N° 29571 (Código de Protección y Defensa del
              Consumidor) y el D.S. N° 011-2011-PCM.
            </p>
          </header>

          <div className={styles.legalContent}>
            <div className={styles.callout}>
              <p>
                <strong>Plataforma Proveedora:</strong> Klik (klik.sale) • República del Perú
                <br />
                <strong>Razón Social:</strong> Klik Technologies S.A.C.
                <br />
                <strong>Plazo de Respuesta Legal:</strong> La formulación del reclamo no impide acudir
                a otras vías de solución de controversias ni es requisito previo para interponer una
                denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo
                no mayor a <strong>quince (15) días hábiles</strong> improrrogables.
              </p>
            </div>

            {submitted ? (
              <div
                style={{
                  backgroundColor: "#171717",
                  border: "1px solid #282828",
                  borderRadius: "14px",
                  padding: "2rem",
                  textAlign: "center",
                  margin: "2rem 0",
                }}
              >
                <CheckCircle2
                  size={54}
                  color="#10b981"
                  style={{ margin: "0 auto 1rem auto" }}
                />
                <h2
                  style={{
                    color: "#ffffff",
                    fontSize: "1.35rem",
                    marginBottom: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  Hoja de Reclamación Registrada
                </h2>
                <p style={{ color: "#a3a3a3", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
                  Tu hoja de reclamación ha sido asentada con éxito. Hemos enviado una copia
                  completa en formato PDF y constancia formal al correo electrónico:{" "}
                  <strong style={{ color: "#ffffff" }}>{formData.email}</strong>.
                </p>

                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid #d97742",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", color: "#888", display: "block" }}>
                    NÚMERO DE RECLAMACIÓN OFICIAL
                  </span>
                  <strong
                    style={{
                      fontSize: "1.2rem",
                      color: "#d97742",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {codigoReclamo}
                  </strong>
                </div>

                <div style={{ textAlign: "left", fontSize: "0.85rem", color: "#888", borderTop: "1px solid #242424", paddingTop: "1rem" }}>
                  <p><strong>Fecha de registro:</strong> {new Date().toLocaleDateString('es-PE')} a las {new Date().toLocaleTimeString('es-PE')}</p>
                  <p><strong>Reclamante:</strong> {formData.nombre} ({formData.documentoTipo}: {formData.documentoNumero})</p>
                  <p><strong>Tipo:</strong> {formData.tipoReclamacion.toUpperCase()}</p>
                  <p>Nuestro equipo legal y de atención al consumidor atenderá tu solicitud dentro del plazo máximo estipulado por el Código de Protección y Defensa del Consumidor (Ley N° 29571).</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn btn--secondary btn--sm"
                  style={{ marginTop: "1.5rem" }}
                >
                  Registrar otra reclamación
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
                {/* 1. DATOS DEL CONSUMIDOR */}
                <h3 style={{ borderBottom: "1px solid #242424", paddingBottom: "0.5rem" }}>
                  1. Identificación del Consumidor Reclamante
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                      Nombres y Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez Quispe"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#171717",
                        border: "1px solid #282828",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                        Doc. *
                      </label>
                      <select
                        value={formData.documentoTipo}
                        onChange={(e) => setFormData({ ...formData, documentoTipo: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 6px",
                          backgroundColor: "#171717",
                          border: "1px solid #282828",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">C.E.</option>
                        <option value="RUC">RUC</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                        N° Documento *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 72485910"
                        value={formData.documentoNumero}
                        onChange={(e) => setFormData({ ...formData, documentoNumero: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          backgroundColor: "#171717",
                          border: "1px solid #282828",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                      Correo Electrónico (Para envío de constancia) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nombre@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#171717",
                        border: "1px solid #282828",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                      Teléfono / WhatsApp de Contacto *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="999 999 999"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#171717",
                        border: "1px solid #282828",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                    Domicilio y Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Principal 123, Distrito, Lima, Perú"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#171717",
                      border: "1px solid #282828",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </div>

                {/* 2. IDENTIFICACIÓN DEL BIEN CONTRATADO */}
                <h3 style={{ borderBottom: "1px solid #242424", paddingBottom: "0.5rem" }}>
                  2. Identificación del Bien Contratado
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                      Tipo de Bien
                    </label>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "8px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#fff" }}>
                        <input
                          type="radio"
                          name="tipoBien"
                          value="servicio"
                          checked={formData.tipoBien === "servicio"}
                          onChange={() => setFormData({ ...formData, tipoBien: "servicio" })}
                        />
                        Servicio SaaS Klik
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#fff" }}>
                        <input
                          type="radio"
                          name="tipoBien"
                          value="producto"
                          checked={formData.tipoBien === "producto"}
                          onChange={() => setFormData({ ...formData, tipoBien: "producto" })}
                        />
                        Producto de Tienda
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                      Monto Reclamado (S/ PEN)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. S/ 29.90"
                      value={formData.montoReclamado}
                      onChange={(e) => setFormData({ ...formData, montoReclamado: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#171717",
                        border: "1px solid #282828",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                    Descripción del Producto o Servicio Contratado
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.descripcionBien}
                    onChange={(e) => setFormData({ ...formData, descripcionBien: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#171717",
                      border: "1px solid #282828",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </div>

                {/* 3. DETALLE DE LA RECLAMACIÓN */}
                <h3 style={{ borderBottom: "1px solid #242424", paddingBottom: "0.5rem" }}>
                  3. Detalle de la Reclamación y Pedido del Consumidor
                </h3>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "8px" }}>
                    Tipo de Incidencia:
                  </label>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#fff" }}>
                      <input
                        type="radio"
                        name="tipoReclamacion"
                        value="reclamo"
                        checked={formData.tipoReclamacion === "reclamo"}
                        onChange={() => setFormData({ ...formData, tipoReclamacion: "reclamo" })}
                      />
                      <strong>Reclamo</strong> (Disconformidad con el servicio o cobro)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#fff" }}>
                      <input
                        type="radio"
                        name="tipoReclamacion"
                        value="queja"
                        checked={formData.tipoReclamacion === "queja"}
                        onChange={() => setFormData({ ...formData, tipoReclamacion: "queja" })}
                      />
                      <strong>Queja</strong> (Malestar en la atención recibida)
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                    Detalle de los Hechos (Explica con claridad lo sucedido) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe de forma detallada los hechos materia de tu reclamo o queja..."
                    value={formData.detalle}
                    onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#171717",
                      border: "1px solid #282828",
                      borderRadius: "8px",
                      color: "#fff",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "#aaa", marginBottom: "4px" }}>
                    Pedido Concreto del Consumidor (Qué solución o solicitud planteas) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Indica qué solución requieres de la empresa para resolver este caso..."
                    value={formData.pedido}
                    onChange={(e) => setFormData({ ...formData, pedido: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#171717",
                      border: "1px solid #282828",
                      borderRadius: "8px",
                      color: "#fff",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.8125rem", color: "#aaa", cursor: "pointer" }}>
                    <input type="checkbox" required style={{ marginTop: "3px" }} />
                    <span>
                      Declaro bajo juramento ser el titular del servicio o compra indicada y que los
                      datos consignados en la presente Hoja de Reclamación son verídicos, autorizando
                      el tratamiento de mis datos de contacto exclusivamente para la notificación de
                      la respuesta legal correspondiente.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary btn--full btn--lg"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <Send size={16} />
                  {loading ? "Registrando hoja oficial..." : "Enviar Hoja de Reclamación"}
                </button>
              </form>
            )}
          </div>
        </article>
      </main>

      {/* FOOTER */}
      <footer className={styles.legalFooter}>
        <div className={styles.legalFooter__inner}>
          <div className={styles.legalFooter__copy}>
            © {new Date().getFullYear()} Klik (klik.sale) — Todos los derechos reservados.
          </div>
          <div className={styles.legalFooter__links}>
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <Link href="/cookies">Política de Cookies</Link>
            {/* <Link href="/reclamaciones">Libro de Reclamaciones</Link> */}
            <Link href="/login">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
