-- ==============================================================================
-- MIGRATION 006: Agregar campo DNI a clientes y pedidos
-- ==============================================================================

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS dni VARCHAR(20);

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_dni VARCHAR(20);

COMMENT ON COLUMN public.customers.dni IS 'Documento Nacional de Identidad (DNI) del cliente';
COMMENT ON COLUMN public.orders.customer_dni IS 'DNI del cliente registrado al realizar el pedido';
