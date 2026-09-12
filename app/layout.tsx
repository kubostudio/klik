import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.scss';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://qori.business'),
  title: {
    default: 'Qori | Tu Tienda Online y Catálogo para Vender por WhatsApp en Perú',
    template: '%s | Qori',
  },
  description:
    'Crea tu catálogo online para móvil en 3 minutos. Tus clientes compran y los pedidos llegan ordenados a tu WhatsApp con DNI. 0% comisiones y cobro directo por Yape, Plin o transferencias. La plataforma #1 en Perú.',
  keywords: [
    'tienda online peru',
    'vender por whatsapp',
    'catalogo digital whatsapp',
    'crear tienda virtual peru',
    'tienda online gratis peru',
    'pedidos por whatsapp',
    'catalogo para whatsapp',
    'tienda virtual para emprendedores',
    'yape y plin catalogo',
    'catalogo online peru',
    'vender por internet peru',
    'ecommerce whatsapp peru',
    'qori',
    'qori business',
    'catalogo de productos online',
    'pedidos con dni peru',
    'gestion de pedidos whatsapp',
    'emprendimiento peru',
  ],
  authors: [{ name: 'Qori', url: 'https://qori.business' }],
  creator: 'Qori',
  publisher: 'Qori',
  applicationName: 'Qori',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://qori.business',
  },
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/logo.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Qori | Tu Tienda Online y Catálogo para Vender por WhatsApp en Perú',
    description:
      'Crea tu catálogo online en 3 minutos. Tus clientes compran y los pedidos llegan ordenados a tu WhatsApp con DNI. 0% comisiones.',
    url: 'https://qori.business',
    siteName: 'Qori',
    locale: 'es_PE',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Qori — Tu Tienda Online y Catálogo para WhatsApp en Perú',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qori | Tu Tienda Online y Catálogo para Vender por WhatsApp en Perú',
    description:
      'Crea tu catálogo online en 3 minutos. Vende por WhatsApp con DNI y 0% comisiones en el Perú.',
    images: ['/og-image.png'],
    creator: '@qori_business',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Schema.org Structured Data for Google Rich Results
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://qori.business/#organization',
      name: 'Qori',
      url: 'https://qori.business',
      logo: 'https://qori.business/logo.png',
      sameAs: ['https://instagram.com/qori.business'],
      description:
        'Plataforma de infraestructura de comercio electrónico para emprendimientos que venden por WhatsApp en el Perú.',
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://qori.business/#webapp',
      name: 'Qori',
      url: 'https://qori.business',
      applicationCategory: 'BusinessApplication, ShoppingApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '19.90',
        priceCurrency: 'PEN',
        priceValidUntil: '2027-12-31',
        availability: 'https://schema.org/InStock',
      },
      description:
        'Crea tu catálogo online para móvil en 3 minutos y recibe pedidos organizados por WhatsApp con DNI y 0% comisiones.',
      screenshot: 'https://qori.business/og-image.png',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://qori.business/#website',
      url: 'https://qori.business',
      name: 'Qori',
      publisher: {
        '@id': 'https://qori.business/#organization',
      },
      inLanguage: 'es-PE',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
