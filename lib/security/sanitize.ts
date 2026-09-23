/**
 * Módulo de Sanitización y Seguridad para Entradas de Usuario (Klik)
 * Previene XSS almacenado/reflejado, caracteres de control nulos e inyecciones.
 */

/**
 * Elimina caracteres de control ASCII (incluyendo byte nulo \0) excepto saltos de línea y tabuladores normales.
 */
export function removeControlChars(input: string): string {
  if (!input) return '';
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Elimina tags HTML y scripts peligrosos de una cadena.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  let sanitized = removeControlChars(input);
  // Eliminar bloques de script y style completos
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Eliminar cualquier otra etiqueta HTML
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  return sanitized;
}

/**
 * Escapa entidades HTML sensibles (&, <, >, ", ').
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitiza texto general (como descripciones, nombres, categorías).
 */
export function sanitizeText(input: string | null | undefined, maxLength: number = 500): string {
  if (!input) return '';
  const stripped = stripHtml(input).trim();
  // Colapsar espacios múltiples
  const clean = stripped.replace(/\s+/g, ' ');
  return clean.slice(0, maxLength);
}

/**
 * Sanitiza el nombre de la tienda: sin HTML, sin caracteres raros, max 60 caracteres.
 */
export function sanitizeStoreName(name: string): string {
  if (!name) return '';
  return sanitizeText(name, 60);
}

/**
 * Valida formato de correo electrónico estándar (RFC 5322 simplificado).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 120) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza y normaliza un correo electrónico (lowercase, trimmed, max 120).
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  const clean = removeControlChars(email).trim().toLowerCase();
  return clean.slice(0, 120);
}

/**
 * Valida formato de usuario de Instagram (1-30 caracteres, letras, números, puntos y guiones bajos).
 */
export function isValidInstagram(handle: string): boolean {
  if (!handle) return true; // es opcional
  const clean = handle.replace(/^@/, '').trim();
  return /^[a-zA-Z0-9._]{1,30}$/.test(clean);
}

/**
 * Sanitiza y normaliza un handle de Instagram (sin @, en minúsculas, solo caracteres válidos).
 */
export function sanitizeInstagram(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const clean = handle.replace(/^@/, '').trim().toLowerCase();
  // Filtrar solo caracteres válidos para Instagram
  const filtered = clean.replace(/[^a-z0-9._]/g, '');
  return filtered ? filtered.slice(0, 30) : null;
}

/**
 * Sanitiza un número de teléfono/WhatsApp dejando solo dígitos y '+' al inicio.
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return (hasPlus ? '+' : '') + digits.slice(0, 15);
}

/**
 * Sanitiza URLs (logos, imágenes, links externos), previniendo pseudo-protocolos javascript: o data:.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.trim();
  if (/^(https?:\/\/)/i.test(clean)) {
    return clean;
  }
  // Si es una ruta relativa válida
  if (clean.startsWith('/') && !clean.startsWith('//')) {
    return clean;
  }
  return null;
}
