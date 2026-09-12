import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Lista de ciudades peruanas para detección en biografía
const PERUVIAN_CITIES = [
  'Lima',
  'Arequipa',
  'Trujillo',
  'Chiclayo',
  'Piura',
  'Cusco',
  'Huancayo',
  'Iquitos',
  'Tacna',
  'Chimbote',
  'Pucallpa',
  'Juliaca',
  'Ica',
  'Cajamarca',
  'Tarapoto',
  'Ayacucho',
  'Huanuco',
];

/**
 * Limpia y normaliza el nombre de usuario de Instagram
 */
function cleanUsername(raw: string): string {
  let cleaned = raw.trim();
  // Eliminar prefijo de URL si fue pegada la URL completa
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  // Quitar parámetros query o hashes
  cleaned = cleaned.split('?')[0].split('#')[0];
  // Quitar slash final
  cleaned = cleaned.replace(/\/+$/, '');
  // Quitar @ iniciales
  cleaned = cleaned.replace(/^@+/, '');
  return cleaned.trim();
}

/**
 * Extrae número de WhatsApp desde texto o URL
 */
function extractWhatsApp(text: string): string | null {
  if (!text) return null;

  // 1. Buscar enlaces wa.me o api.whatsapp.com
  const waUrlMatch = text.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d+)/i);
  if (waUrlMatch && waUrlMatch[1]) {
    const digits = waUrlMatch[1].replace(/\D/g, '');
    if (digits.length >= 9) {
      return digits.startsWith('51') && digits.length === 11 ? `+${digits}` : digits;
    }
  }

  // 2. Buscar números celulares peruanos (9 dígitos que inician con 9)
  const phoneMatch = text.match(/(?:whatsapp|wssp|wsp|pedidos|contacto|cel|tel|fono)?:?\s*(?:\+?51\s*)?(9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/i);
  if (phoneMatch && phoneMatch[1]) {
    const cleanPhone = phoneMatch[1].replace(/\D/g, '');
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
    const regex = new RegExp(`\\b${city}\\b`, 'i');
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
  username: string
): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!imgRes.ok) return null;

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage bucket 'qori-media' dentro de 'stores/'
    const timestamp = Date.now();
    const filePath = `stores/insta-${username}-${timestamp}.jpg`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('qori-media')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError || !uploadData) {
      console.warn('Could not persist Instagram avatar in Supabase Storage:', uploadError);
      return imageUrl; // Fallback al URL original
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('qori-media')
      .getPublicUrl(uploadData.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Error downloading/uploading Instagram avatar:', err);
    return imageUrl;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUsername = body?.username;

    if (!rawUsername || typeof rawUsername !== 'string') {
      return NextResponse.json(
        { error: 'Por favor ingresa un nombre de usuario de Instagram válido.' },
        { status: 400 }
      );
    }

    const username = cleanUsername(rawUsername);
    if (!username) {
      return NextResponse.json(
        { error: 'Nombre de usuario no válido.' },
        { status: 400 }
      );
    }

    // Crawlers reconocidos por Instagram para obtener metadatos y Relay stream
    const userAgents = [
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Twitterbot/1.0',
    ];

    let html = '';
    for (const ua of userAgents) {
      try {
        const res = await fetch(`https://www.instagram.com/${username}/`, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
          },
          next: { revalidate: 60 },
        });

        if (res.ok) {
          html = await res.text();
          if (html.length > 5000) break;
        }
      } catch (err) {
        console.warn(`Attempt failed with UA ${ua}:`, err);
      }
    }

    if (!html) {
      return NextResponse.json(
        {
          error:
            'No se pudo conectar con Instagram. Por favor verifica que la cuenta exista y sea pública.',
        },
        { status: 404 }
      );
    }

    // 1. Intento de extracción profunda mediante scripts JSON (RelayPrefetchedStreamCache)
    let extractedUser: {
      fullName?: string;
      username?: string;
      biography?: string;
      profilePicUrl?: string;
      externalUrl?: string;
    } | null = null;

    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = scriptRegex.exec(html)) !== null) {
      const content = match[1];
      if (
        content.includes('xig_user_by_igid_v2') ||
        (content.includes('biography') && content.includes('profile_pic_url'))
      ) {
        try {
          const parsed = JSON.parse(content);
          const findUser = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj.biography !== undefined && (obj.username || obj.full_name)) {
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
                (Array.isArray(found.bio_links) && found.bio_links[0]?.url),
            };
            break;
          }
        } catch {
          // Continuar buscando en siguientes scripts
        }
      }
    }

    // 2. Extracción fallback por OpenGraph Meta Tags
    let name = extractedUser?.fullName?.trim() || '';
    let biography = extractedUser?.biography?.trim() || '';
    let rawAvatar = extractedUser?.profilePicUrl || '';
    let externalUrl = extractedUser?.externalUrl || '';

    // Si falta alguno, complementar con etiquetas OpenGraph
    if (!name) {
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]*)"/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        let t = ogTitleMatch[1]
          .replace(/&#064;/g, '@')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');
        const parts = t.split('(@');
        name = parts[0].trim();
      }
    }

    if (!rawAvatar) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"/i);
      if (ogImageMatch && ogImageMatch[1]) {
        rawAvatar = ogImageMatch[1].replace(/&amp;/g, '&');
      }
    }

    if (!biography) {
      const descMatch =
        html.match(/<meta content="([^"]*)" name="description"/i) ||
        html.match(/<meta name="description" content="([^"]*)"/i);
      if (descMatch && descMatch[1]) {
        const d = descMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const bioInQuotes =
          d.match(/on Instagram:\s*"([^"]*)"/i) || d.match(/en Instagram:\s*"([^"]*)"/i);
        if (bioInQuotes && bioInQuotes[1]) {
          biography = bioInQuotes[1].trim();
        }
      }
    }

    // Si no se encontró ningún dato mínimo
    if (!name && !biography && !rawAvatar) {
      return NextResponse.json(
        {
          error:
            `No pudimos encontrar datos públicos para el usuario @${username}. Asegúrate de que la cuenta exista y no sea privada.`,
        },
        { status: 404 }
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
      permanentLogoUrl = await uploadInstagramAvatarToStorage(rawAvatar, username);
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
    console.error('Error importing from Instagram:', err);
    return NextResponse.json(
      { error: err?.message || 'Error interno al procesar el perfil de Instagram.' },
      { status: 500 }
    );
  }
}
