import Link from "next/link";
import { Metadata } from "next";
import styles from "@/styles/modules/legal.module.scss";
import { ArrowLeft, ShieldCheck, FileText, Cookie, BookOpen } from "lucide-react";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso | Klik",
  description:
    "Términos y condiciones legales para el uso de la plataforma de catálogos y gestión de pedidos Klik.",
};

export default function TerminosPage() {
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
          <Link
            href="/terminos"
            className={`${styles.legalTab} ${styles["legalTab--active"]}`}
          >
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
            <span className="badge badge--soft">Legal & Cumplimiento</span>
            <h1>Términos y Condiciones de Uso</h1>
            <p>Última actualización: Septiembre de 2026 • República del Perú</p>
          </header>

          <div className={styles.legalContent}>
            <div className={styles.callout}>
              <p>
                <strong>Resumen Clave:</strong> Klik es una plataforma de
                software (SaaS) que permite a negocios crear catálogos en línea
                y recibir pedidos ordenados a través de WhatsApp. Klik{" "}
                <strong>no cobra comisiones por venta</strong>,{" "}
                <strong>no procesa cobros de los compradores</strong> ni
                interviene en el despacho de productos, siendo el vendedor el
                único responsable de la calidad, entrega y cobro de sus
                mercancías.
              </p>
            </div>

            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al registrarte, acceder o utilizar el servicio provisto por{" "}
              <strong>Klik</strong> (en adelante "la Plataforma", accesible
              mediante el dominio <strong>klik.sale</strong> y sus
              subdominios), aceptas cumplir de manera irrevocable con los
              presentes Términos y Condiciones, así como con nuestra Política de
              Privacidad. Si no estás de acuerdo con estos términos, debes
              abstenerte de utilizar la Plataforma.
            </p>

            <h2>2. Descripción del Servicio</h2>
            <p>
              Klik proporciona una solución de software como servicio (SaaS)
              orientada a emprendedores, marcas y comercios en el Perú. Las
              funcionalidades incluyen:
            </p>
            <ul>
              <li>
                Creación y personalización de catálogos digitales optimizados
                para smartphones.
              </li>
              <li>
                Gestión de productos con imágenes, descripciones, precios en
                Soles (PEN) y variantes (tallas, colores).
              </li>
              <li>
                Generación de pedidos con registro obligatorio de datos del
                comprador (incluyendo Documento Nacional de Identidad - DNI,
                nombre y WhatsApp).
              </li>
              <li>
                Despacho automatizado del resumen de compra hacia el número de
                WhatsApp oficial del comercio vendedor.
              </li>
              <li>
                Directorio de clientes, métricas de visitas y conversión en
                tiempo real.
              </li>
            </ul>

            <h2>3. Registro de Cuenta y Veracidad de Información</h2>
            <p>
              Para acceder a las funcionalidades de administración, el usuario
              debe crear una cuenta proporcionando información veraz, precisa y
              actualizada:
            </p>
            <ul>
              <li>
                Debes ser mayor de edad (18 años o más) bajo las leyes peruanas
                para registrar una tienda.
              </li>
              <li>
                Eres responsable exclusivo de resguardar la confidencialidad de
                tus credenciales de acceso.
              </li>
              <li>
                Klik se reserva el derecho de suspender o cancelar cuentas que
                utilicen información falsa, identidades suplantadas o nombres de
                comercios registrados por terceros sin autorización.
              </li>
            </ul>

            <h2>4. Independencia de las Transacciones Comerciales</h2>
            <p>
              <strong>4.1. Relación entre Comprador y Vendedor:</strong> Klik
              actúa exclusivamente como proveedor de infraestructura
              tecnológica. La compraventa de productos se celebra directa y
              exclusivamente entre el comercio vendedor y su cliente a través de
              WhatsApp o los canales de pago directos coordinados entre ellos
              (Yape, Plin, transferencias bancarias o contraentrega).
            </p>
            <p>
              <strong>4.2. Cero Comisiones de Intermediación:</strong> Klik no
              retiene fondos, no cobra comisiones porcentuales sobre las ventas
              ni custodia dinero de los pedidos. El 100% del valor pagado por el
              comprador va directo al vendedor.
            </p>
            <p>
              <strong>
                4.3. Obligaciones Tributarias y Emisión de Comprobantes:
              </strong>{" "}
              Es responsabilidad exclusiva del comercio vendedor cumplir con las
              obligaciones tributarias ante la SUNAT (emisión de boletas de
              venta, facturas electrónicas y declaraciones correspondientes).
            </p>

            <h2>5. Suscripción, Tarifas y Período de Prueba</h2>
            <ul>
              <li>
                <strong>Tarifa Mensual:</strong> Culminada la prueba, el acceso
                a la plataforma tiene un costo fijo de{" "}
                <strong>S/ 29.90 Soles por mes</strong> (Plan Klik), el cual
                otorga productos ilimitados, pedidos ilimitados y soporte
                prioritario.
              </li>
              <li>
                <strong>Cancelación:</strong> El usuario puede cancelar su
                suscripción en cualquier momento desde su panel de configuración
                sin penalidades ni cobros por permanencia mínima.
              </li>
            </ul>

            <h2>6. Usos Prohibidos y Conducta del Usuario</h2>
            <p>
              Está estrictamente prohibido utilizar la Plataforma para ofrecer,
              promocionar o comercializar:
            </p>
            <ul>
              <li>
                Sustancias ilícitas, estupefacientes o medicamentos que
                requieran receta médica sin debida autorización.
              </li>
              <li>
                Armas de fuego, explosivos o artículos prohibidos por la ley
                peruana.
              </li>
              <li>
                Productos falsificados, réplicas no autorizadas o que vulneren
                derechos de propiedad intelectual de terceros.
              </li>
              <li>Esquemas piramidales, estafas o contenido fraudulento.</li>
            </ul>
            <p>
              Cualquier comercio que infrinja estas disposiciones será dado de
              baja de forma inmediata e irrevocable, sin derecho a reembolso y
              pudiendo ser reportado a las autoridades pertinentes (Ministerio
              Público / Policía Nacional del Perú).
            </p>

            <h2>7. Propiedad Intelectual</h2>
            <p>
              Todos los derechos de propiedad intelectual sobre el código
              fuente, diseño visual, logotipos, marcas comerciales y
              arquitectura de software de Klik pertenecen a sus respectivos
              titulares. El usuario conserva la total propiedad intelectual
              sobre sus fotografías de productos, logotipos comerciales y
              descripciones cargadas en su tienda.
            </p>

            <h2>8. Limitación de Responsabilidad</h2>
            <p>
              En la máxima medida permitida por el Código de Protección y
              Defensa del Consumidor (Ley N° 29571) y la legislación peruana,
              Klik no será responsable por:
            </p>
            <ul>
              <li>
                Incumplimientos en la entrega, retrasos o defectos de los
                productos comercializados por los vendedores registrados.
              </li>
              <li>
                Disputas o reclamos monetarios entre compradores y vendedores.
              </li>
              <li>
                Interrupciones temporales del servicio derivadas de fallas en
                proveedores de alojamiento en la nube o en la red de WhatsApp /
                Meta Platforms Inc.
              </li>
            </ul>

            <h2>9. Modificaciones y Ley Aplicable</h2>
            <p>
              Klik podrá actualizar estos Términos periódicamente. Cualquier
              cambio sustancial será notificado con razonable anticipación en el
              panel de control o por correo electrónico. Estos términos se rigen
              e interpretan bajo las leyes de la{" "}
              <strong>República del Perú</strong>, sometiéndose a la competencia
              de los jueces y tribunales del distrito judicial de Lima.
            </p>

            <h2>10. Contacto</h2>
            <p>
              Para cualquier consulta legal o aclaración sobre estos Términos,
              puedes comunicarte con nuestro equipo a través de{" "}
              <strong>soporte@klik.sale</strong>.
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
