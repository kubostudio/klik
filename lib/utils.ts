/**
 * Formatea un número al estándar monetario de Perú (Soles: S/ 0.00)
 */
export function formatCurrency(amount: number): string {
  return `S/${amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convierte un texto a slug URL amigable (ej: "Polo Algodón Pima" -> "polo-algodon-pima")
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Formatea fechas a formato peruano amigable (ej: 08/09/2026, 17:30)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Obtiene o inicializa un ID de sesión anónimo en el navegador para registrar eventos analíticos
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("klik_sid");
  if (!sid) {
    sid =
      "sid_" +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
    localStorage.setItem("klik_sid", sid);
  }
  return sid;
}
