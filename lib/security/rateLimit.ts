import { NextRequest } from 'next/server';

/**
 * Rate Limiter en memoria con algoritmo de ventana deslizante (Sliding Window).
 * Previene ataques de fuerza bruta, escaneo y abusos en endpoints sensibles.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros antiguos para evitar fugas de memoria
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      // Filtrar marcas de tiempo mayores a 1 hora
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 10 * 60 * 1000); // Cada 10 minutos
}

export interface RateLimitOptions {
  limit: number;     // Número máximo de peticiones permitidas en la ventana
  windowMs: number;  // Duración de la ventana en milisegundos
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp en segundos en el que se restablece
}

/**
 * Evalúa si una clave dada excede el límite de peticiones en la ventana de tiempo.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Descartar marcas fuera de la ventana actual
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const currentCount = record.timestamps.length;
  const isAllowed = currentCount < options.limit;

  if (isAllowed) {
    record.timestamps.push(now);
  }

  const oldestTimestamp = record.timestamps[0] || now;
  const resetTimeMs = oldestTimestamp + options.windowMs;
  const resetInSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

  return {
    success: isAllowed,
    limit: options.limit,
    remaining: Math.max(0, options.limit - (currentCount + (isAllowed ? 1 : 0))),
    reset: resetInSeconds,
  };
}

/**
 * Obtiene la dirección IP real del cliente a partir de cabeceras estándar de proxies y Cloudflare.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Tomar la primera IP de la lista
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}
