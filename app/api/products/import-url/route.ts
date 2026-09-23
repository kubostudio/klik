import { NextRequest, NextResponse } from "next/server";

interface ExtractedProduct {
  name?: string;
  price?: string;
  description?: string;
  category?: string;
  brand?: string;
  images: string[];
}

/**
 * Valida que la URL sea válida y previene SSRF a redes locales/privadas
 */
function isValidPublicUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // Bloquear localhost y rangos privados comunes
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Normaliza URLs de imágenes relativas a absolutas
 */
function toAbsoluteUrl(imgUrl: string, baseUrl: string): string {
  try {
    return new URL(imgUrl, baseUrl).href;
  } catch {
    return imgUrl;
  }
}

/**
 * Decodifica entidades HTML básicas
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Limpia texto HTML de etiquetas y espacios extra
 */
function stripHtml(htmlStr: string): string {
  return decodeHtmlEntities(
    htmlStr.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  );
}

/**
 * Formatea y normaliza un precio numérico como string (ej. "89.90")
 */
function cleanPrice(raw: any): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") {
    return raw > 0 ? raw.toFixed(2) : undefined;
  }
  const str = String(raw).trim();
  // Buscar números con decimales en texto (ej. "S/ 89.90", "$120.00", "PEN 75", "£51.77", "€29.99")
  const match = str.match(/(?:S\/\.?|S\/\s*|\$|PEN\s*|USD\s*|EUR\s*|€|£|¥)?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (match && match[1]) {
    const num = parseFloat(match[1].replace(",", "."));
    if (!isNaN(num) && num > 0) {
      return num.toFixed(2);
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;

    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
      return NextResponse.json(
        { error: "Por favor ingresa una URL válida del producto." },
        { status: 400 }
      );
    }

    const targetUrl = rawUrl.trim();
    if (!isValidPublicUrl(targetUrl)) {
      return NextResponse.json(
        { error: "La URL proporcionada no es válida o no es accesible públicamente." },
        { status: 400 }
      );
    }

    // Encabezados para simular un navegador real y evitar bloqueos por bot
    const userAgents = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ];

    let html = "";
    let finalUrl = targetUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": userAgents[0],
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "es-PE,es-419;q=0.9,es;q=0.8,en;q=0.7",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
        redirect: "follow",
        signal: controller.signal,
        next: { revalidate: 0 },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `No se pudo obtener la página del producto (Código ${response.status}).` },
          { status: response.status >= 500 ? 502 : 400 }
        );
      }

      finalUrl = response.url || targetUrl;
      html = await response.text();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return NextResponse.json(
          { error: "La página tardó demasiado en responder (tiempo límite excedido)." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "No se pudo conectar con el sitio web del producto. Verifica la conexión o el enlace." },
        { status: 502 }
      );
    }

    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { error: "La página retornó un contenido vacío o no reconocible." },
        { status: 400 }
      );
    }

    const extracted: ExtractedProduct = {
      images: [],
    };

    // Si la respuesta es JSON directo (ej. API e-commerce o feed)
    const trimmed = html.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsedJson = JSON.parse(trimmed);
        if (parsedJson.title || parsedJson.name) {
          extracted.name = decodeHtmlEntities(String(parsedJson.title || parsedJson.name));
        }
        if (parsedJson.description) {
          extracted.description = stripHtml(String(parsedJson.description));
        }
        if (parsedJson.price !== undefined) {
          extracted.price = cleanPrice(parsedJson.price);
        }
        if (parsedJson.category) {
          extracted.category = decodeHtmlEntities(String(parsedJson.category));
        }
        if (parsedJson.brand) {
          extracted.brand = decodeHtmlEntities(String(parsedJson.brand));
        }
        if (parsedJson.image) {
          const img = toAbsoluteUrl(String(parsedJson.image), finalUrl);
          extracted.images.push(img);
        } else if (Array.isArray(parsedJson.images)) {
          for (const im of parsedJson.images) {
            if (typeof im === "string") {
              extracted.images.push(toAbsoluteUrl(im, finalUrl));
            }
          }
        }

        if (extracted.name || extracted.price || extracted.images.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              name: extracted.name || "",
              price: extracted.price || "",
              description: extracted.description || "",
              category: extracted.category || "",
              brand: extracted.brand || "",
              images: extracted.images.slice(0, 6),
            },
          });
        }
      } catch {
        // Continuar con parsing HTML normal si falló
      }
    }

    // =========================================================================
    // ESTRATEGIA 1: Schema.org JSON-LD (E-commerce estándar: Shopify, Woo, etc.)
    // =========================================================================
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonLdMatch: RegExpExecArray | null;

    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const rawJson = jsonLdMatch[1].trim();
        const parsed = JSON.parse(rawJson);

        const findProduct = (obj: any): any => {
          if (!obj || typeof obj !== "object") return null;
          if (
            obj["@type"] === "Product" ||
            (Array.isArray(obj["@type"]) && obj["@type"].includes("Product"))
          ) {
            return obj;
          }
          if (Array.isArray(obj["@graph"])) {
            for (const item of obj["@graph"]) {
              const found = findProduct(item);
              if (found) return found;
            }
          }
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const found = findProduct(item);
              if (found) return found;
            }
          }
          return null;
        };

        const prod = findProduct(parsed);
        if (prod) {
          if (!extracted.name && prod.name) {
            extracted.name = decodeHtmlEntities(String(prod.name));
          }
          if (!extracted.description && prod.description) {
            extracted.description = stripHtml(String(prod.description));
          }
          if (!extracted.brand) {
            if (typeof prod.brand === "string") {
              extracted.brand = decodeHtmlEntities(prod.brand);
            } else if (prod.brand && typeof prod.brand === "object" && prod.brand.name) {
              extracted.brand = decodeHtmlEntities(String(prod.brand.name));
            }
          }
          if (!extracted.category && prod.category) {
            extracted.category = decodeHtmlEntities(String(prod.category));
          }

          // Precios en offers
          if (!extracted.price && prod.offers) {
            const offers = Array.isArray(prod.offers) ? prod.offers : [prod.offers];
            for (const off of offers) {
              const p = off?.price || off?.lowPrice || off?.highPrice;
              const formatted = cleanPrice(p);
              if (formatted) {
                extracted.price = formatted;
                break;
              }
            }
          }

          // Imágenes en JSON-LD
          if (prod.image) {
            const rawImgs = Array.isArray(prod.image) ? prod.image : [prod.image];
            for (const img of rawImgs) {
              let url = "";
              if (typeof img === "string") {
                url = img;
              } else if (img && typeof img === "object" && img.url) {
                url = img.url;
              } else if (img && typeof img === "object" && img.contentUrl) {
                url = img.contentUrl;
              }
              if (url && typeof url === "string") {
                const abs = toAbsoluteUrl(url, finalUrl);
                if (!extracted.images.includes(abs)) {
                  extracted.images.push(abs);
                }
              }
            }
          }
        }
      } catch {
        // Ignorar bloques JSON-LD malformados
      }
    }

    // =========================================================================
    // ESTRATEGIA 2: Open Graph y Twitter Meta Tags
    // =========================================================================
    const getMeta = (names: string[]): string | undefined => {
      for (const name of names) {
        // Formato property="..." content="..."
        const regex1 = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
        const match1 = html.match(regex1);
        if (match1 && match1[1]) return decodeHtmlEntities(match1[1]);

        // Formato content="..." property="..."
        const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i");
        const match2 = html.match(regex2);
        if (match2 && match2[1]) return decodeHtmlEntities(match2[1]);
      }
      return undefined;
    };

    if (!extracted.name) {
      extracted.name = getMeta(["og:title", "twitter:title"]);
      // Si el título viene con sufijo tipo " | Marca" o " - Tienda", limpiarlo suavemente
      if (extracted.name) {
        extracted.name = extracted.name.split(/\s+[|\-–—]\s+/)[0].trim();
      }
    }

    if (!extracted.description) {
      extracted.description = getMeta(["og:description", "twitter:description", "description"]);
    }

    if (!extracted.price) {
      const p = getMeta(["product:price:amount", "og:price:amount"]);
      if (p) extracted.price = cleanPrice(p);
    }

    if (!extracted.brand) {
      extracted.brand = getMeta(["product:brand", "og:brand"]);
    }

    // Imagen OpenGraph
    const ogImg = getMeta(["og:image", "og:image:secure_url", "twitter:image"]);
    if (ogImg) {
      const abs = toAbsoluteUrl(ogImg, finalUrl);
      if (!extracted.images.includes(abs)) {
        extracted.images.unshift(abs); // Colocar al frente como portada
      }
    }

    // =========================================================================
    // ESTRATEGIA 3: Microdata HTML (itemprop="...")
    // =========================================================================
    if (!extracted.name) {
      const nameMatch = html.match(/itemprop=["']name["'][^>]*>([^<]+)<\//i);
      if (nameMatch && nameMatch[1]) {
        extracted.name = decodeHtmlEntities(nameMatch[1].trim());
      }
    }

    if (!extracted.price) {
      const priceMatch =
        html.match(/itemprop=["']price["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/itemprop=["']price["'][^>]*>([^<]+)<\//i);
      if (priceMatch && priceMatch[1]) {
        extracted.price = cleanPrice(priceMatch[1]);
      }
    }

    // =========================================================================
    // ESTRATEGIA 4: Heurísticas Semánticas en HTML (Fallback)
    // =========================================================================
    if (!extracted.name) {
      // Buscar el primer <h1> que no sea la marca
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        extracted.name = stripHtml(h1Match[1]);
      } else {
        // Tag <title>
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          extracted.name = stripHtml(titleMatch[1]).split(/\s+[|\-–—]\s+/)[0].trim();
        }
      }
    }

    // Detección de precio en clases comunes de e-commerce
    if (!extracted.price) {
      const priceRegexes = [
        /(?:class|id)=["'][^"']*(?:product-price|current-price|price-current|price__current|price_color|final-price|sale-price)[^"']*["'][^>]*>([\s\S]*?)<\//i,
        /<(?:span|div|p|strong|b)[^>]+class=["'][^"']*price[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p|strong|b)>/i,
        /<(?:span|div|p|strong|b)[^>]+id=["'][^"']*price[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p|strong|b)>/i,
      ];
      for (const rx of priceRegexes) {
        const m = html.match(rx);
        if (m && m[1]) {
          const found = cleanPrice(stripHtml(m[1]));
          if (found) {
            extracted.price = found;
            break;
          }
        }
      }
    }

    // Si aún no hay imágenes, buscar tags <img> relevantes de productos
    if (extracted.images.length === 0) {
      const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
      let imgMatch: RegExpExecArray | null;
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        const src = imgMatch[1];
        if (
          src &&
          !src.endsWith(".svg") &&
          !src.includes("logo") &&
          !src.includes("icon") &&
          !src.includes("banner") &&
          !src.includes("avatar") &&
          !src.includes("pixel") &&
          (src.includes("product") || src.includes("upload") || src.includes("media") || src.includes("cdn"))
        ) {
          const abs = toAbsoluteUrl(src, finalUrl);
          if (!extracted.images.includes(abs)) {
            extracted.images.push(abs);
            if (extracted.images.length >= 6) break;
          }
        }
      }
    }

    // Limitar a 6 fotos máximo (el límite del carrusel del producto)
    const finalImages = extracted.images.slice(0, 6);

    // Detección o inferencia de marca a partir del dominio si no se extrajo
    if (!extracted.brand) {
      try {
        const parsed = new URL(finalUrl);
        const hostParts = parsed.hostname.replace(/^www\./, "").split(".");
        if (hostParts.length >= 2) {
          const rawBrand = hostParts[0];
          extracted.brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
        }
      } catch {
        // Ignorar
      }
    }

    // Validar si logramos extraer al menos un dato útil
    if (!extracted.name && !extracted.price && finalImages.length === 0) {
      return NextResponse.json(
        {
          error:
            "No se pudieron extraer datos del producto desde este enlace. La página podría requerir inicio de sesión o estar bloqueada contra lectura externa.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: extracted.name || "",
        price: extracted.price || "",
        description: extracted.description || "",
        category: extracted.category || "",
        brand: extracted.brand || "",
        images: finalImages,
      },
    });
  } catch (err: any) {
    console.error("Error scraping product from URL:", err);
    return NextResponse.json(
      {
        error:
          err?.message || "Ocurrió un error inesperado al procesar el enlace del producto.",
      },
      { status: 500 }
    );
  }
}
