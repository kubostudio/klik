/**
 * Sube una imagen a Supabase Storage mediante el endpoint /api/upload
 * y retorna la URL pública del archivo subido.
 */
export async function uploadImage(
  file: File,
  folder: "stores" | "products" = "products",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Error al subir la imagen a Supabase");
  }

  return data.url;
}

/**
 * Extrae la ruta relativa dentro de klik-media para verificar si la imagen pertenece a Supabase Storage.
 */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;
  const clean = urlOrPath.trim();
  if (!clean) return null;

  if (clean.startsWith("products/") || clean.startsWith("stores/")) {
    return clean.split("?")[0];
  }

  const match = clean.match(/\/klik-media\/(.+?)(\?.*)?$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Elimina una o más imágenes de Supabase Storage mediante el endpoint /api/upload
 */
export async function deleteStorageImages(
  urls: (string | null | undefined)[],
): Promise<boolean> {
  const validUrls = urls.filter((u): u is string =>
    Boolean(u && extractStoragePath(u)),
  );
  if (validUrls.length === 0) return true;

  try {
    const res = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: validUrls }),
    });

    const data = await res.json();
    return Boolean(res.ok && data.success);
  } catch (err) {
    console.error("Error in deleteStorageImages:", err);
    return false;
  }
}
