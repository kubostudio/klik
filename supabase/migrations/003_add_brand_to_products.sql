-- ==============================================================================
-- MIGRATION 003: Agregar atributo marca a productos
-- ==============================================================================

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand TEXT;

COMMENT ON COLUMN public.products.brand IS 'Marca del producto (ej: Nike, Samsung, Artesanal)';
