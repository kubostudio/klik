-- ============================================================
-- 007: Stock en productos, facturación del negocio y vouchers
-- ============================================================

-- 1. Agregar columna stock a products (NULL = sin control de stock)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;

-- 2. Tabla de facturación/métodos de cobro por tienda
CREATE TABLE IF NOT EXISTS store_billing (
  store_id   UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Agregar voucher y método de pago a los pedidos
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS voucher_url     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT NULL;

-- 4. RLS para store_billing
ALTER TABLE store_billing ENABLE ROW LEVEL SECURITY;

-- Propietario de la tienda puede leer y escribir
CREATE POLICY "Owner can manage billing"
  ON store_billing
  FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Índice para búsqueda rápida de pedidos con voucher pendiente de revisión
CREATE INDEX IF NOT EXISTS idx_orders_voucher ON orders (store_id, status)
  WHERE voucher_url IS NOT NULL;
