import { NextRequest, NextResponse } from 'next/server';
import { checkStoreUniqueness } from '@/lib/supabase/db';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';
import {
  sanitizeStoreName,
  sanitizeEmail,
  sanitizeInstagram,
} from '@/lib/security/sanitize';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limiter: máximo 30 verificaciones por minuto por IP
    const rateCheck = checkRateLimit(`validate:${ip}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes de validación. Por favor espera un momento.',
          resetInSeconds: rateCheck.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.reset),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await req.json();
    const rawName = body?.name;
    const rawSlug = body?.slug;
    const rawInstagram = body?.instagram;
    const rawEmail = body?.email;
    const excludeStoreId = body?.excludeStoreId;

    const name = rawName ? sanitizeStoreName(rawName) : undefined;
    const slug = rawSlug ? String(rawSlug).trim().toLowerCase() : undefined;
    const instagram = rawInstagram ? sanitizeInstagram(rawInstagram) : undefined;
    const email = rawEmail ? sanitizeEmail(rawEmail) : undefined;

    const result = await checkStoreUniqueness({
      name,
      slug,
      instagram,
      email,
      excludeStoreId,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  } catch (err: any) {
    console.error('Error in /api/stores/validate:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al validar datos de la tienda' },
      { status: 500 }
    );
  }
}
