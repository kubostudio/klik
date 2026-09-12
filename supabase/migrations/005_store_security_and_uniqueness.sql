-- ==============================================================================
-- MIGRATION 005: Seguridad y Unicidad de Tiendas (Nombre, Instagram y Correo)
-- ==============================================================================
-- 1. Agrega columna 'email' a la tabla stores si aún no existe.
-- 2. Crea índices únicos insensibles a mayúsculas/minúsculas para:
--    - Nombre de tienda: único en toda la plataforma
--    - Correo de contacto/vendedor: único cuando se especifica
--    - Usuario de Instagram: único cuando se especifica
-- ==============================================================================

-- 1. Agregar columna email a public.stores
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Índice único para Nombre de Tienda (Case-Insensitive y sin espacios sobrantes)
CREATE UNIQUE INDEX IF NOT EXISTS stores_name_lower_unique_idx
ON public.stores (LOWER(TRIM(name)));

-- 3. Índice único para Correo de Tienda (Case-Insensitive, excluyendo nulos y vacíos)
CREATE UNIQUE INDEX IF NOT EXISTS stores_email_lower_unique_idx
ON public.stores (LOWER(TRIM(email)))
WHERE email IS NOT NULL AND TRIM(email) <> '';

-- 4. Índice único para Usuario de Instagram (Case-Insensitive, excluyendo nulos y vacíos)
CREATE UNIQUE INDEX IF NOT EXISTS stores_instagram_lower_unique_idx
ON public.stores (LOWER(TRIM(instagram)))
WHERE instagram IS NOT NULL AND TRIM(instagram) <> '';
