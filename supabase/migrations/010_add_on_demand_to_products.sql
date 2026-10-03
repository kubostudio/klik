-- ============================================================
-- 010: Productos a pedido (On Demand / Pre-order)
-- ============================================================

-- 1. Agregar columna on_demand a products (TRUE = producto a pedido con separación por WhatsApp)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS on_demand BOOLEAN DEFAULT FALSE;

-- 2. Comentario explicativo
COMMENT ON COLUMN public.products.on_demand IS 'Indica si el producto es a pedido (sin stock, precio opcional, separación directa por WhatsApp en vez de carrito)';
