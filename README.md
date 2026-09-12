# Qori — E-commerce & Catálogo Digital para Vender por WhatsApp

> Plataforma de comercio electrónico diseñada para que tiendas, marcas y emprendedores en el Perú vendan directamente por WhatsApp con 0% de comisiones por venta.

---

## Características Principales

- **Catálogo Online Moderno & Rápido**: Navegación fluida para compradores desde Instagram, TikTok y enlaces directos.
- **Showcase con Carrusel Interactivo**: Soporte multi-imagen para productos con galerías interactivas.
- **Checkout sin Fricción con DNI**: Registro obligatorio de DNI de 8 dígitos para control de entregas y facturación.
- **Cierre en WhatsApp en 1 Clic**: Envío automatizado de la orden estructurada con productos, cantidades, variantes, DNI y dirección.
- **Importador desde Instagram**: Autocompleta nombre, biografía, foto/logo de alta calidad, ciudad y WhatsApp con solo ingresar el `@usuario`.
- **Panel de Control Operativo (Dashboard)**:
  - Gestión de pedidos con actualización de estados en tiempo real (*Nuevo, Contactado, Confirmado, Entregado, Cancelado*).
  - Generador de respuestas predeterminadas para WhatsApp por cada estado de pedido.
  - Directorio y CRM de clientes con historial de compras, DNI y monto acumulado.
  - Automatizaciones y recordatorios de seguimiento a clientes.
  - Estadísticas y embudo de conversión en tiempo real.
- **Onboarding Guiado en 4 Pasos**: Configuración de tienda y catálogo en menos de 3 minutos.
- **Diseño Geist Monocromático & Modo Oscuro Obsidian**: Interfaz minimalista inspirada en `DESIGN.md` con paleta obsidian (`#0a0a0a`), bordes hairline y logotipo vectorial oficial.
- **Páginas Legales Adaptadas a Perú**: Términos y Condiciones y Política de Privacidad conforme a la Ley N° 29733 (Protección de Datos Personales).

---

## Tecnologías Utilizadas

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Vanilla CSS & SCSS Modules con metodología BEM
- **Tipografía**: [Geist](https://vercel.com/font)
- **Base de Datos & Auth & Storage**: [Supabase](https://supabase.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **SEO & Metadatos**: JSON-LD Structured Data (Schema.org), OpenGraph y Sitemap dinámico

---

## Instalación y Configuración Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/kubostudio/qori.git
cd qori
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Compilar para producción

```bash
npm run build
npm run start
```

---

## Licencia

Desarrollado para **Qori** / **KUBO Studio**. Todos los derechos reservados.
