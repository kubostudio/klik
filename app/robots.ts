import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: 'https://qori.business/sitemap.xml',
    host: 'https://qori.business',
  };
}
