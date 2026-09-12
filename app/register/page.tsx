'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '@/styles/modules/auth.module.scss';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/ui/Logo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad para crear tu cuenta.');
      return;
    }

    setLoading(true);

    try {
      // Guardar información temporal del vendedor en sesión/storage
      localStorage.setItem(
        'qori_seller_session',
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          plan: selectedPlan,
          acceptedTerms: true,
          acceptedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
      );

      // Redirigir de inmediato al Onboarding (no al dashboard vacío)
      router.push('/onboarding');
    } catch {
      setError('Ocurrió un error al registrar tu cuenta. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad para registrarte con Google.');
      return;
    }

    setLoading(true);
    localStorage.setItem(
      'qori_seller_session',
      JSON.stringify({
        name: 'Emprendedor Qori',
        email: 'vendedor@gmail.com',
        plan: selectedPlan,
        acceptedTerms: true,
        acceptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    );
    router.push('/onboarding');
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <Link
            href="/"
            className={styles.logo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0a0a0a',
              borderRadius: '12px',
              padding: '8px 16px',
              marginBottom: '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Logo size={44} color="#ffffff" />
          </Link>
          <h1>Crea tu cuenta</h1>
          <p>Empieza a vender por WhatsApp en pocos minutos</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignup}
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
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Tu nombre</label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="Ej. Ana Morales"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="ana@negocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                color: 'var(--color-ink)',
                lineHeight: 1.45,
              }}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{
                  marginTop: '0.15rem',
                  cursor: 'pointer',
                  accentColor: 'var(--color-ink)',
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                }}
              />
              <span>
                He leído y acepto obligatoriamente los{' '}
                <Link
                  href="/terminos"
                  target="_blank"
                  style={{ textDecoration: 'underline', fontWeight: 600, color: 'var(--color-ink)' }}
                >
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link
                  href="/privacidad"
                  target="_blank"
                  style={{ textDecoration: 'underline', fontWeight: 600, color: 'var(--color-ink)' }}
                >
                  Política de Privacidad
                </Link>{' '}
                de Qori.
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Continuar al onboarding'} <ArrowRight size={16} />
          </button>
        </form>

        <div className={styles.authFooter}>
          ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className={styles.authContainer}>Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

