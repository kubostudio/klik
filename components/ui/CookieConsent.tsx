"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("klik_cookie_consent");
      if (!consent) {
        // Small delay so it transitions in smoothly
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("klik_cookie_consent", "all");
      localStorage.setItem("klik_cookie_consent_date", new Date().toISOString());
    } catch {}
    setVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem("klik_cookie_consent", "essential");
      localStorage.setItem("klik_cookie_consent_date", new Date().toISOString());
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de cookies y consentimiento"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        left: "1.25rem",
        maxWidth: "940px",
        margin: "0 auto 0 auto",
        zIndex: 9999,
        backgroundColor: "rgb(31 30 30)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid #282828",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)",
        padding: "1.25rem 1.25rem",
        color: "#ffffff",
        animation: "slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            backgroundColor: "rgba(217, 119, 66, 0.15)",
            border: "1px solid rgba(217, 119, 66, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#d97742",
          }}
        >
          <Cookie size={20} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "#ffffff",
              marginBottom: "0.25rem",
              letterSpacing: "-0.01em",
            }}
          >
            Tu privacidad y el uso de cookies
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#a3a3a3",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Utilizamos cookies técnicas y almacenamiento local para operar tu catálogo,
            mantener tu sesión segura y recordar tus productos. No vendemos tus datos.
            Consulta nuestra{" "}
            <Link
              href="/cookies"
              style={{
                color: "#d97742",
                textDecoration: "underline",
                fontWeight: 500,
              }}
            >
              Política de Cookies
            </Link>{" "}
            y{" "}
            <Link
              href="/privacidad"
              style={{
                color: "#d97742",
                textDecoration: "underline",
                fontWeight: 500,
              }}
            >
              Privacidad
            </Link>.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleAcceptAll}
              type="button"
              className="btn btn--primary btn--sm"
              style={{
                fontSize: "0.8125rem",
                padding: "6px 14px",
                borderRadius: "8px",
              }}
            >
              Aceptar todas
            </button>
            <button
              onClick={handleAcceptEssential}
              type="button"
              className="btn btn--secondary btn--sm"
              style={{
                fontSize: "0.8125rem",
                padding: "6px 14px",
                borderRadius: "8px",
                backgroundColor: "rgb(232 227 227)",
                borderColor: "#333",
              }}
            >
              Solo esenciales
            </button>
          </div>
        </div>

        <button
          onClick={handleAcceptEssential}
          type="button"
          aria-label="Cerrar aviso de cookies"
          style={{
            background: "transparent",
            border: "none",
            color: "#666",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
