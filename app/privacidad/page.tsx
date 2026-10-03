import Link from "next/link";
import { Metadata } from "next";
import styles from "@/styles/modules/legal.module.scss";
import { ArrowLeft, ShieldCheck, FileText, Cookie, BookOpen } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Política de Privacidad | Klik",
  description:
    "Política de privacidad y protección de datos personales de Klik en cumplimiento con la Ley N° 29733 de la República del Perú.",
};

export default function PrivacidadPage() {
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
          <Link
            href="/privacidad"
            className={`${styles.legalTab} ${styles["legalTab--active"]}`}
          >
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
            <span className="badge badge--soft">
              Privacidad & Datos Personales
            </span>
            <h1>Política de Privacidad</h1>
            <p>
              Conforme a la Ley N° 29733 (Ley de Protección de Datos Personales
              del Perú)
            </p>
          </header>

          <div className={styles.legalContent}>
            <div className={styles.callout}>
              <p>
                <strong>Compromiso con tu privacidad:</strong> En Klik
                respetamos y protegemos la privacidad de nuestros usuarios y de
                los compradores finales de sus catálogos.{" "}
                <strong>
                  No vendemos ni comercializamos tus bases de datos de clientes
                  ni información personal a terceros bajo ninguna circunstancia.
                </strong>
              </p>
            </div>

            <h2>1. Marco Normativo</h2>
            <p>
              La presente Política de Privacidad regula el tratamiento de datos
              personales realizado a través de la plataforma{" "}
              <strong>klik.sale</strong>, en estricto cumplimiento con la{" "}
              <strong>Ley N° 29733</strong> (Ley de Protección de Datos
              Personales del Perú), su Reglamento aprobado por{" "}
              <strong>Decreto Supremo N° 003-2013-JUS</strong> y las directivas
              emitidas por la Autoridad Nacional de Protección de Datos
              Personales (ANPD).
            </p>

            <h2>2. Información que Recopilamos</h2>
            <h3>A. Datos del Vendedor / Administrador de la Tienda:</h3>
            <ul>
              <li>Nombre y apellidos o razón social del negocio.</li>
              <li>Correo electrónico de contacto y credenciales de acceso.</li>
              <li>Número de WhatsApp oficial para la recepción de pedidos.</li>
              <li>Usuario público de Instagram y enlaces a redes sociales.</li>
              <li>Ciudad y país de operación.</li>
            </ul>

            <h3>
              B. Datos del Comprador Final (al realizar un pedido en el
              catálogo):
            </h3>
            <ul>
              <li>
                <strong>Nombres y Apellidos:</strong> Para identificar al
                titular de la compra.
              </li>
              <li>
                <strong>Documento Nacional de Identidad (DNI):</strong>{" "}
                Requerido obligatoriamente para la emisión de comprobantes de
                pago por el vendedor y para la verificación de identidad en la
                entrega o despacho del paquete.
              </li>
              <li>
                <strong>Número de WhatsApp / Teléfono móvil:</strong> Para
                coordinar el pago, despacho y entrega de la orden.
              </li>
              <li>
                <strong>Dirección o Punto de Entrega:</strong> Para el cálculo y
                coordinación del envío logístico.
              </li>
            </ul>

            <h2>3. Finalidad del Tratamiento de los Datos</h2>
            <p>
              Los datos personales recolectados son utilizados exclusivamente
              para:
            </p>
            <ul>
              <li>
                Facilitar la creación y gestión técnica del catálogo digital del
                vendedor.
              </li>
              <li>
                Permitir que el comprador envíe su pedido detallado directamente
                al WhatsApp del comercio vendedor.
              </li>
              <li>
                Organizar el historial de pedidos y el directorio de clientes en
                el panel del comerciante para facilitar recompras y
                fidelización.
              </li>
              <li>
                Garantizar la seguridad, autenticación y prevención de fraudes
                en la plataforma.
              </li>
              <li>
                Generar analíticas de tráfico y conversión anónimas y agregadas
                para la optimización del catálogo.
              </li>
            </ul>

            <h2>4. Almacenamiento, Resguardo y Seguridad</h2>
            <p>
              Todos los datos son procesados y almacenados en servidores de alta
              seguridad mediante infraestructura en la nube (Supabase /
              PostgreSQL) con encriptación en tránsito (SSL/TLS HTTPS) y en
              reposo. Implementamos políticas de seguridad a nivel de fila (Row
              Level Security - RLS) para garantizar que cada vendedor únicamente
              tenga acceso a la información de sus propios clientes y pedidos.
            </p>

            <h2>5. Tratamiento de Datos por parte del Comercio Vendedor</h2>
            <p>
              Al recibir pedidos a través de Klik, el comercio vendedor actúa
              como titular del banco de datos de sus propios clientes y se
              compromete a:
            </p>
            <ul>
              <li>
                Utilizar los datos de sus compradores únicamente para la
                tramitación, despacho y soporte del pedido realizado.
              </li>
              <li>
                No divulgar ni transferir los números de teléfono, DNI o
                direcciones de sus clientes a terceros no vinculados con el
                servicio de mensajería o delivery.
              </li>
              <li>
                Respetar las solicitudes de sus compradores de no recibir
                mensajes promocionales futuros si así lo solicitan.
              </li>
            </ul>

            <h2>6. Ejercicio de Derechos ARCO</h2>
            <p>
              De conformidad con la Ley N° 29733, los titulares de los datos
              personales tienen derecho a ejercer sus derechos de{" "}
              <strong>
                Acceso, Rectificación, Cancelación y Oposición (ARCO)
              </strong>{" "}
              respecto de su información almacenada:
            </p>
            <ul>
              <li>
                <strong>Vendedores registrados:</strong> Pueden actualizar,
                modificar o solicitar la eliminación total de su tienda y cuenta
                enviando un correo a <strong>privacidad@klik.sale</strong> o
                directamente desde su panel de configuración.
              </li>
              <li>
                <strong>Compradores finales:</strong> Pueden solicitar la
                supresión de sus registros de pedidos dirigiéndose al comercio
                vendedor correspondiente o escribiendo a nuestro canal de
                soporte para la eliminación de sus datos en nuestra
                infraestructura.
              </li>
            </ul>

            <h2>7. Uso de Cookies y Píxeles de Conversión</h2>
            <p>
              Klik utiliza cookies técnicas estrictamente necesarias para
              mantener la sesión de usuario activa y el contenido del carrito de
              compras. Si el vendedor decide activar integraciones de terceros, dichas
              herramientas recopilarán datos de navegación conforme a las
              políticas de privacidad de Meta Platforms Inc. y Google LLC
              respectivamente.
            </p>

            <h2>8. Modificaciones a esta Política</h2>
            <p>
              Nos reservamos el derecho de modificar esta Política de Privacidad
              para adaptarla a futuras novedades legislativas o
              jurisprudenciales. Cualquier actualización entrará en vigencia
              inmediatamente tras su publicación en esta misma URL.
            </p>

            <h2>9. Canal de Contacto</h2>
            <p>
              Para cualquier duda o solicitud referente al resguardo de tus
              datos personales, puedes escribirnos a{" "}
              <strong>privacidad@klik.sale</strong>.
            </p>
          </div>
        </article>
      </main>

      {/* FOOTER */}
      <footer className={styles.legalFooter}>
        <div className={styles.legalFooter__inner}>
          <div className={styles.legalFooter__copy}>
            © {new Date().getFullYear()} Klik (klik.sale) — Todos los
            derechos reservados.
          </div>
          <div className={styles.legalFooter__links}>
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <Link href="/cookies">Política de Cookies</Link>
            {/* <Link href="/reclamaciones">Libro de Reclamaciones</Link> */}
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
