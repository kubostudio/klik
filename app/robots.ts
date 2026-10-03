import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://klik.sale/sitemap.xml",
    host: "https://klik.sale",
  };
}
