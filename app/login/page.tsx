"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/styles/modules/auth.module.scss";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem(
        "klik_seller_session",
        JSON.stringify({
          email: email.trim(),
          plan: "pro",
          loggedInAt: new Date().toISOString(),
        }),
      );
      router.push("/dashboard");
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    localStorage.setItem(
      "klik_seller_session",
      JSON.stringify({
        email: "vendedor@gmail.com",
        plan: "pro",
      }),
    );
    router.push("/dashboard");
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <Link
            href="/"
            className={styles.logo}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 16px",
              marginBottom: "1rem",
            }}
          >
            <Logo size={44} color="#d97742" />
          </Link>
          <h1>Iniciar sesión</h1>
          <p>Bienvenido de vuelta a tu panel de ventas</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              color: "#EF4444",
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* <button
          type="button"
          onClick={handleGoogleLogin}
          className={styles.socialBtn}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className={styles.divider}>
          <span>o con tu correo</span>
        </div> */}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="tu@negocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label htmlFor="password">Contraseña</label>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                onClick={() =>
                  alert(
                    "Te enviaremos un correo para restablecer tu contraseña.",
                  )
                }
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className={styles.authFooter}>
          ¿Aún no tienes tienda? <Link href="/register">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
