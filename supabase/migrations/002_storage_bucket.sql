-- ==============================================================================
-- Qori - Configuración de Supabase Storage (Bucket de Imágenes)
-- ==============================================================================

-- 1. Crear el bucket público 'qori-media' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'qori-media',
    'qori-media',
    true,
    5242880, -- 5 MB límite por imagen
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Políticas de acceso para storage.objects
-- A. Permitir lectura pública de todas las imágenes
CREATE POLICY "Public Read Access for qori-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'qori-media');

-- B. Permitir subir imágenes al bucket
CREATE POLICY "Public Upload Access for qori-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qori-media');

-- C. Permitir actualizar y eliminar imágenes
CREATE POLICY "Public Update Access for qori-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qori-media');

CREATE POLICY "Public Delete Access for qori-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'qori-media');
