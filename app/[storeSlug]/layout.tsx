import { getStoreBySlug } from '@/lib/supabase/db';
import { Clock, MessageCircle } from 'lucide-react';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeSlug: string };
}) {
  const store = await getStoreBySlug(params.storeSlug);

  // Si la tienda está inactiva en la base de datos (is_active === false), bloquear todo acceso público
  if (store && store.is_active === false) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#141414',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(217, 119, 66, 0.15)',
              color: '#d97742',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <Clock size={32} />
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {store.name}
          </h1>

          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              color: '#fb923c',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: '999px',
              padding: '0.25rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            ● Tienda Inactiva / Pendiente de Pago
          </div>

          <p
            style={{
              fontSize: '0.9rem',
              color: '#a3a3a3',
              lineHeight: 1.6,
              margin: '0 0 1.75rem 0',
            }}
          >
            Esta tienda online se encuentra temporalmente inactiva o en proceso de activación de suscripción. El catálogo público y la recepción de pedidos no están disponibles.
          </p>

          <a
            href={`https://wa.me/51906013310?text=${encodeURIComponent(
              `Hola KUBOstudio, soy el propietario de la tienda ${store.name} (slug: ${store.slug}) y solicito activarla.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#25D366',
              color: '#ffffff',
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              width: '100%',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
            }}
          >
            <MessageCircle size={18} /> Contactar a KUBOstudio
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
