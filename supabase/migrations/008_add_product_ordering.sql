-- ============================================================
-- 008: Ordenación de productos en tienda pública y dashboard
-- ============================================================

-- 1. Agregar columna product_sort_mode a stores ('custom', 'name_asc', 'name_desc', 'price_asc', 'price_desc')
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS product_sort_mode TEXT DEFAULT 'custom';

-- 2. Agregar columna sort_order a products (entero para definir el orden manual)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Índice para acelerar la consulta de productos ordenados por tienda
CREATE INDEX IF NOT EXISTS idx_products_store_sort_order
  ON public.products (store_id, sort_order ASC, created_at DESC);
