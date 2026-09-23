-- ============================================================
-- 009: Visibilidad de stock y precio en tienda pública
-- ============================================================

-- 1. Agregar columna show_stock a products (TRUE = muestra la cantidad disponible al cliente)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_stock BOOLEAN DEFAULT TRUE;

-- 2. Agregar columna show_price a products (TRUE = muestra el precio en la tienda pública)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_price BOOLEAN DEFAULT TRUE;

-- 3. Comentarios explicativos
COMMENT ON COLUMN public.products.show_stock IS 'Indica si se muestra la cantidad de stock en la tienda pública';
COMMENT ON COLUMN public.products.show_price IS 'Indica si se muestra el precio del producto en la tienda pública';
