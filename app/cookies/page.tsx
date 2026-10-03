import Link from "next/link";
import { Metadata } from "next";
import styles from "@/styles/modules/legal.module.scss";
import { ArrowLeft, ShieldCheck, FileText, Cookie, BookOpen } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Política de Cookies | Klik",
  description:
    "Información transparente sobre el uso de cookies, almacenamiento local y tecnologías de seguimiento en la plataforma Klik.",
};

export default function CookiesPage() {
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
          <Link
            href="/cookies"
            className={`${styles.legalTab} ${styles["legalTab--active"]}`}
          >
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
          {/* <Link href="/reclamaciones" className={styles.legalTab}>
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
            <span className="badge badge--soft">Transparencia & Privacidad</span>
            <h1>Política de Cookies</h1>
            <p>Última actualización: Octubre de 2026 • República del Perú</p>
          </header>

          <div className={styles.legalContent}>
            <div className={styles.callout}>
              <p>
                <strong>Resumen Clave:</strong> Klik utiliza cookies y almacenamiento local
                estrictamente para garantizar el funcionamiento técnico del catálogo (mantener
                tu sesión de vendedor activa, recordar los productos agregados a la bolsa de
                compras y prevenir abusos de seguridad). <strong>No comercializamos tus datos
                ni los de tus compradores con intermediarios de publicidad invasiva.</strong>
              </p>
            </div>

            <h2>1. ¿Qué son las Cookies y el Almacenamiento Local?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
              navegador o dispositivo cuando los visitas. Permiten que la plataforma recuerde
              tus acciones y preferencias (como el inicio de sesión, productos en el carrito o
              preferencias de navegación) durante un período de tiempo determinado.
            </p>
            <p>
              Asimismo, Klik emplea tecnologías modernas de almacenamiento web HTML5
              (<strong>localStorage</strong> y <strong>sessionStorage</strong>) para optimizar la
              velocidad de carga en conexiones móviles y permitir que tus clientes sigan armando
              su pedido sin perder su progreso si se interrumpe momentáneamente su conexión celular.
            </p>

            <h2>2. Tipos de Cookies y Tecnologías que Empleamos</h2>
            <p>
              En la plataforma <strong>klik.sale</strong> y en los catálogos digitales de los
              comercios clasificados utilizamos las siguientes categorías de cookies:
            </p>

            <h3>A. Cookies Técnicas y Estrictamente Necesarias (Obligatorias)</h3>
            <p>
              Son esenciales para el funcionamiento básico del servicio y no pueden ser
              desactivadas en nuestros sistemas, ya que sin ellas la plataforma no podría operar.
            </p>
            <ul>
              <li>
                <strong>sb-*-auth-token (Supabase Auth):</strong> Mantiene la sesión segura y
                autenticada del comerciante en el panel de control.
              </li>
              <li>
                <strong>klik_cart_state:</strong> Almacena en la memoria del dispositivo los
                artículos, variantes y cantidades agregadas por el comprador antes de enviarlos
                a WhatsApp.
              </li>
              <li>
                <strong>klik_cookie_consent:</strong> Registra si el usuario ha aceptado o
                configurado el aviso de cookies para no solicitarlo repetitivamente.
              </li>
            </ul>

            <h3>B. Cookies de Preferencias y Funcionalidad</h3>
            <p>
              Permiten recordar configuraciones personalizadas del usuario, como el tema visual
              seleccionado, filtros aplicados en el catálogo de la tienda o preferencias de
              ordenamiento de productos.
            </p>

            <h3>C. Cookies Analíticas y de Rendimiento</h3>
            <p>
              Nos ayudan a comprender de manera agregada y 100% anónima cómo interactúan los
              visitantes con las páginas, qué productos son los más visualizados y detectar
              posibles errores de navegación para mejorar la rapidez y estabilidad de la
              infraestructura.
            </p>

            <h3>D. Cookies de Terceros y Píxeles de Conversión</h3>
            <p>
              Cuando un comerciante activa voluntariamente integraciones de marketing en su
              tienda, dichas plataformas externas pueden
              colocar sus propias cookies para el seguimiento de eventos y conversión publicitaria.
              El tratamiento de esos datos se rige bajo las políticas de privacidad de Meta
              Platforms Inc. y Google LLC respectivamente.
            </p>

            <h2>3. Tabla Detallada de Cookies y Almacenamiento</h2>
            <div style={{ overflowX: "auto", margin: "1.5rem 0" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                  border: "1px solid var(--color-hairline, #242424)",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", textAlign: "left" }}>
                    <th style={{ padding: "10px", borderBottom: "1px solid #242424" }}>Nombre</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #242424" }}>Proveedor</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #242424" }}>Propósito</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #242424" }}>Duración</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #242424" }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}><code>sb-*-auth-token</code></td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Klik / Supabase</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Autenticación segura del vendedor</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Sesión / 1 año</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Esencial</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}><code>klik_cookie_consent</code></td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Klik</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Consentimiento del aviso de cookies</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>1 año</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Preferencias</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}><code>klik_cart_items</code></td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Klik (LocalStorage)</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Contenido del carrito de compras</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Persistente</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Esencial</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}><code>_ga, _ga_*</code></td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Google Analytics</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Estadísticas anónimas de visitas (opcional)</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>2 años</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Analítica</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}><code>_fbp</code></td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Meta Platforms</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Píxel de Meta activado por la tienda</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>90 días</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #242424" }}>Publicidad</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. ¿Cómo Controlar, Bloquear o Eliminar las Cookies?</h2>
            <p>
              Tienes pleno derecho a revocar tu consentimiento o configurar el uso de cookies
              en cualquier momento desde las opciones de configuración de tu navegador. Ten en
              cuenta que si bloqueas las cookies técnicas esenciales, es posible que no puedas
              iniciar sesión en tu panel de administración o que el carrito de compras no retenga
              los productos seleccionados.
            </p>
            <p>
              Puedes consultar cómo gestionar cookies en los principales navegadores a través de
              los siguientes enlaces oficiales:
            </p>
            <ul>
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Chrome (Computadora y Android)
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/es-es/HT201265"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Safari (macOS e iOS / iPhone)
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h2>5. Actualizaciones de la Política de Cookies</h2>
            <p>
              Klik puede modificar esta Política de Cookies en función de nuevas exigencias
              legislativas o técnicas. Cualquier cambio sustancial será debidamente informado
              en esta misma página y a través del banner de consentimiento.
            </p>

            <h2>6. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies o el manejo de datos en tu
              navegación, puedes contactarnos en <strong>privacidad@klik.sale</strong> o
              en <strong>soporte@klik.sale</strong>.
            </p>
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
