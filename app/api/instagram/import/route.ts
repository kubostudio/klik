import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Lista de ciudades peruanas para detección en biografía
const PERUVIAN_CITIES = [
  "Lima",
  "Arequipa",
  "Trujillo",
  "Chiclayo",
  "Piura",
  "Cusco",
  "Huancayo",
  "Iquitos",
  "Tacna",
  "Chimbote",
  "Pucallpa",
  "Juliaca",
  "Ica",
  "Cajamarca",
  "Tarapoto",
  "Ayacucho",
  "Huanuco",
];

/**
 * Limpia y normaliza el nombre de usuario de Instagram
 */
function cleanUsername(raw: string): string {
  let cleaned = raw.trim();
  // Eliminar prefijo de URL si fue pegada la URL completa
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  // Quitar parámetros query o hashes
  cleaned = cleaned.split("?")[0].split("#")[0];
  // Quitar slash final
  cleaned = cleaned.replace(/\/+$/, "");
  // Quitar @ iniciales
  cleaned = cleaned.replace(/^@+/, "");
  return cleaned.trim();
}

/**
 * Extrae número de WhatsApp desde texto o URL
 */
function extractWhatsApp(text: string): string | null {
  if (!text) return null;

  // 1. Buscar enlaces wa.me o api.whatsapp.com
  const waUrlMatch = text.match(
    /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d+)/i,
  );
  if (waUrlMatch && waUrlMatch[1]) {
    const digits = waUrlMatch[1].replace(/\D/g, "");
    if (digits.length >= 9) {
      return digits.startsWith("51") && digits.length === 11
        ? `+${digits}`
        : digits;
    }
  }

  // 2. Buscar números celulares peruanos (9 dígitos que inician con 9)
  const phoneMatch = text.match(
    /(?:whatsapp|wssp|wsp|pedidos|contacto|cel|tel|fono)?:?\s*(?:\+?51\s*)?(9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/i,
  );
  if (phoneMatch && phoneMatch[1]) {
    const cleanPhone = phoneMatch[1].replace(/\D/g, "");
    if (cleanPhone.length === 9) {
      return `+51 ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
    }
  }

  return null;
}

/**
 * Extrae ciudad si se menciona en el texto
 */
function extractCity(text: string): string | null {
  if (!text) return null;
  for (const city of PERUVIAN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(text)) {
      return city;
    }
  }
  return null;
}

/**
 * Descarga la imagen de perfil de Instagram y la sube a Supabase Storage
 */
async function uploadInstagramAvatarToStorage(
  imageUrl: string,
  username: string,
): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    if (!imgRes.ok) return null;

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage bucket 'klik-media' dentro de 'stores/'
    const timestamp = Date.now();
    const filePath = `stores/insta-${username}-${timestamp}.jpg`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("klik-media")
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError || !uploadData) {
      console.warn(
        "Could not persist Instagram avatar in Supabase Storage:",
        uploadError,
      );
      return imageUrl; // Fallback al URL original
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("klik-media")
      .getPublicUrl(uploadData.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("Error downloading/uploading Instagram avatar:", err);
    return imageUrl;
  }
}

/**
 * Consulta perfil de Instagram usando RapidAPI (instagram-looter2)
 */
async function fetchFromRapidApi(username: string): Promise<{
  name: string;
  biography: string;
  rawAvatar: string;
  externalUrl: string;
  isPrivate: boolean;
} | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  try {
    const fields =
      "full_name,username,biography,profile_pic_url,profile_pic_url_hd,external_url,bio_links[].url,is_private";
    const url = `https://instagram-looter2.p.rapidapi.com/profile?username=${encodeURIComponent(username)}&fields=${fields}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("RapidAPI instagram-looter2 returned status:", res.status);
      return null;
    }

    const data = await res.json();
    const name = data?.full_name?.trim() || "";
    const biography = data?.biography?.trim() || "";
    const rawAvatar = data?.profile_pic_url_hd || data?.profile_pic_url || "";
    const externalUrl =
      data?.external_url ||
      (Array.isArray(data?.bio_links) && data?.bio_links[0]?.url) ||
      "";
    const isPrivate = Boolean(data?.is_private);

    if (name || biography || rawAvatar) {
      return { name, biography, rawAvatar, externalUrl, isPrivate };
    }
  } catch (err) {
    console.warn("Error calling RapidAPI instagram-looter2:", err);
  }
  return null;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUsername = body?.username;

    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json(
        {
          error: "Por favor ingresa un nombre de usuario de Instagram válido.",
        },
        { status: 400 },
      );
    }

    const username = cleanUsername(rawUsername);
    if (!username) {
      return NextResponse.json(
        { error: "Nombre de usuario no válido." },
        { status: 400 },
      );
    }

    let name = "";
    let biography = "";
    let rawAvatar = "";
    let externalUrl = "";

    // 1. Intentar primero con RapidAPI (instagram-looter2) si está configurado
    const rapidApiData = await fetchFromRapidApi(username);
    if (rapidApiData) {
      name = rapidApiData.name;
      biography = rapidApiData.biography;
      rawAvatar = rapidApiData.rawAvatar;
      externalUrl = rapidApiData.externalUrl;
    } else {
      // 2. Fallback: Crawlers reconocidos por Instagram
      const userAgents = [
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "WhatsApp/2.21.12.21 A",
        "Twitterbot/1.0",
        "TelegramBot (like TwitterBot)",
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      ];

      let extractedUser: {
        fullName?: string;
        username?: string;
        biography?: string;
        profilePicUrl?: string;
        externalUrl?: string;
      } | null = null;

      // Intentar con cada User-Agent secuencialmente hasta encontrar datos reales de perfil
      for (const ua of userAgents) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);

          const res = await fetch(`https://www.instagram.com/${username}/`, {
            headers: {
              "User-Agent": ua,
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-Mode": "navigate",
            },
            cache: "no-store",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) continue;

          const html = await res.text();
          if (!html || html.length < 1000) continue;

          // Intento de extracción profunda mediante scripts JSON (RelayPrefetchedStreamCache)
          const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
          let match: RegExpExecArray | null;

          while ((match = scriptRegex.exec(html)) !== null) {
            const content = match[1];
            if (
              content.includes("xig_user_by_igid_v2") ||
              (content.includes("biography") &&
                content.includes("profile_pic_url"))
            ) {
              try {
                const parsed = JSON.parse(content);
                const findUser = (obj: any): any => {
                  if (!obj || typeof obj !== "object") return null;
                  if (
                    obj.biography !== undefined &&
                    (obj.username || obj.full_name)
                  ) {
                    return obj;
                  }
                  for (const key of Object.keys(obj)) {
                    const found = findUser(obj[key]);
                    if (found) return found;
                  }
                  return null;
                };

                const found = findUser(parsed);
                if (found) {
                  extractedUser = {
                    fullName: found.full_name,
                    username: found.username,
                    biography: found.biography,
                    profilePicUrl: found.profile_pic_url,
                    externalUrl:
                      found.external_url ||
                      (Array.isArray(found.bio_links) &&
                        found.bio_links[0]?.url),
                  };
                  break;
                }
              } catch {
                // Continuar buscando en siguientes scripts
              }
            }
          }

          // Extraer valores base si se encontraron en JSON
          if (extractedUser) {
            name = extractedUser.fullName?.trim() || "";
            biography = extractedUser.biography?.trim() || "";
            rawAvatar = extractedUser.profilePicUrl || "";
            externalUrl = extractedUser.externalUrl || "";
          }

          // Extracción fallback por OpenGraph Meta Tags si falta algún campo
          if (!name) {
            const ogTitleMatch = html.match(
              /<meta property="og:title" content="([^"]*)"/i,
            );
            if (ogTitleMatch && ogTitleMatch[1]) {
              let t = ogTitleMatch[1]
                .replace(/&#064;/g, "@")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .trim();

              const isGenericTitle =
                /^login\b/i.test(t) ||
                /^iniciar sesión\b/i.test(t) ||
                /^instagram$/i.test(t);

              if (!isGenericTitle) {
                const parts = t.split("(@");
                const cleanTitle = parts[0].replace(/•.*/, "").trim();
                if (cleanTitle) {
                  name = cleanTitle;
                }
              }
            }
          }

          if (!rawAvatar) {
            const ogImageMatch = html.match(
              /<meta property="og:image" content="([^"]*)"/i,
            );
            if (ogImageMatch && ogImageMatch[1]) {
              const img = ogImageMatch[1].replace(/&amp;/g, "&");
              const isPlaceholder =
                img.includes("rsrc.php") ||
                img.includes("static.cdninstagram.com/rsrc") ||
                img.includes("instagram_logo");
              if (!isPlaceholder) {
                rawAvatar = img;
              }
            }
          }

          if (!biography) {
            const descMatch =
              html.match(/<meta content="([^"]*)" name="description"/i) ||
              html.match(/<meta name="description" content="([^"]*)"/i);
            if (descMatch && descMatch[1]) {
              const d = descMatch[1]
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, "&");
              const bioMatch = d.match(
                /(?:on Instagram|en Instagram):\s*["“«]?([^"”»\n\r]*)/i,
              );
              if (bioMatch && bioMatch[1]) {
                biography = bioMatch[1].trim();
              }
            }
          }

          if (name || biography || rawAvatar) {
            break;
          }
        } catch (err) {
          console.warn(`Attempt failed with UA ${ua}:`, err);
        }
      }
    }

    // Si después de todos los UAs no se encontró ningún dato mínimo
    if (!name && !biography && !rawAvatar) {
      return NextResponse.json(
        {
          error: `No pudimos encontrar datos públicos para el usuario @${username}. Asegúrate de que la cuenta exista y no sea privada.`,
        },
        { status: 404 },
      );
    }

    // 3. Extracción de WhatsApp
    const combinedText = `${biography} ${externalUrl}`;
    const detectedWhatsApp = extractWhatsApp(combinedText);

    // 4. Extracción de Ciudad
    const detectedCity = extractCity(biography);

    // 5. Descarga y persistencia del avatar en Supabase Storage
    let permanentLogoUrl: string | null = null;
    if (rawAvatar) {
      permanentLogoUrl = await uploadInstagramAvatarToStorage(
        rawAvatar,
        username,
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: name || username,
        username,
        description: biography,
        logoUrl: permanentLogoUrl || rawAvatar || null,
        whatsapp: detectedWhatsApp || null,
        city: detectedCity || null,
        instagram: `@${username}`,
      },
    });
  } catch (err: any) {
    console.error("Error importing from Instagram:", err);
    return NextResponse.json(
      {
        error:
          err?.message || "Error interno al procesar el perfil de Instagram.",
      },
      { status: 500 },
    );
  }
}
