-- ============================================================
-- 011: Control de activación de tiendas por suscripción (KUBOstudio)
-- ============================================================

-- 1. Agregar columna is_active a stores (DEFAULT FALSE para nuevas tiendas)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- 2. Asegurar que tiendas existentes queden activas si su valor es NULL
UPDATE public.stores
  SET is_active = TRUE
  WHERE is_active IS NULL;

-- 3. Comentario explicativo
COMMENT ON COLUMN public.stores.is_active IS 'Indica si la tienda está activa tras confirmar el pago de la suscripción a KUBOstudio (TRUE = pública; FALSE = inactiva)';
