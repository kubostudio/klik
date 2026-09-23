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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { error: "No se envió ningún archivo." },
        { status: 400 },
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Solo se aceptan imágenes JPG, PNG, WEBP o GIF.",
        },
        { status: 400 },
      );
    }

    // Validar tamaño máximo (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen excede el límite permitido de 5MB." },
        { status: 400 },
      );
    }

    // Generar nombre de archivo único y limpio
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedFolder = folder === "stores" ? "stores" : "products";
    const filePath = `${sanitizedFolder}/${timestamp}-${randomSuffix}.${extension}`;

    // Convertir a buffer para Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage
    let { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("klik-media")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    // Si el bucket no existe, intentar crearlo automáticamente con permisos públicos
    if (
      uploadError &&
      (uploadError.message?.toLowerCase().includes("not found") ||
        (uploadError as any).statusCode === "404" ||
        (uploadError as any).status === 404)
    ) {
      console.log("Bucket 'klik-media' no encontrado. Intentando crearlo automáticamente...");
      const { error: createError } = await supabaseAdmin.storage.createBucket("klik-media", {
        public: true,
        fileSizeLimit: 5242880,
      });

      if (!createError) {
        const retry = await supabaseAdmin.storage
          .from("klik-media")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });
        uploadData = retry.data;
        uploadError = retry.error;
      }
    }

    if (uploadError || !uploadData) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      return NextResponse.json(
        {
          error: `No se encontró el bucket 'klik-media' en Supabase Storage. Debes crearlo desde el panel de Supabase > Storage con el nombre 'klik-media' y marcarlo como público.`,
          detail: uploadError?.message || "No se recibieron datos de subida",
        },
        { status: 500 },
      );
    }

    // Obtener la URL pública directa
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("klik-media")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: uploadData.path,
    });
  } catch (err: any) {
    console.error("Unexpected error in /api/upload:", err);
    return NextResponse.json(
      {
        error:
          err.message || "Error interno del servidor al procesar la imagen.",
      },
      { status: 500 },
    );
  }
}

/**
 * Extrae la ruta relativa dentro del bucket 'klik-media' a partir de una URL o path.
 */
function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;
  const clean = urlOrPath.trim();
  if (!clean) return null;

  // Si ya es una ruta relativa como "products/..." o "stores/..."
  if (clean.startsWith("products/") || clean.startsWith("stores/")) {
    return clean.split("?")[0];
  }

  // Si es una URL completa que contiene el bucket /klik-media/
  const match = clean.match(/\/klik-media\/(.+?)(\?.*)?$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const urlsOrPaths: string[] = Array.isArray(body?.urls)
      ? body.urls
      : Array.isArray(body?.paths)
        ? body.paths
        : body?.url
          ? [body.url]
          : body?.path
            ? [body.path]
            : [];

    if (urlsOrPaths.length === 0) {
      return NextResponse.json(
        { error: "No se especificaron imágenes a eliminar." },
        { status: 400 },
      );
    }

    const pathsToDelete = urlsOrPaths
      .map(extractStoragePath)
      .filter((p): p is string => Boolean(p));

    if (pathsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No se encontraron rutas pertenecientes a klik-media.",
        removed: [],
      });
    }

    const { data, error } = await supabaseAdmin.storage
      .from("klik-media")
      .remove(pathsToDelete);

    if (error) {
      console.error("Error deleting from Supabase Storage:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      removed: data,
    });
  } catch (err: any) {
    console.error("Unexpected error in DELETE /api/upload:", err);
    return NextResponse.json(
      { error: err.message || "Error interno al eliminar imagen(es)." },
      { status: 500 },
    );
  }
}
