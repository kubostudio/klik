-- ==============================================================================
-- Klik (klik.sale) - Esquema Inicial de Base de Datos PostgreSQL / Supabase
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Secuencia para número de pedido por tienda
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

-- 3. Tabla de Tiendas (stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    whatsapp TEXT NOT NULL,
    instagram TEXT,
    facebook TEXT,
    city TEXT,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla de Productos (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    category TEXT DEFAULT 'General',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabla de Imágenes adicionales de Producto (product_images)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

-- 6. Tabla de Variantes de Producto (product_variants)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ej: 'Talla', 'Color', 'Presentación'
    value TEXT NOT NULL -- ej: 'M', 'Rojo', '500ml'
);

-- 7. Tabla de Clientes del Vendedor (customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    total_orders INT NOT NULL DEFAULT 0,
    total_spent NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    last_order_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_customer_phone UNIQUE(store_id, phone)
);

-- 8. Tabla de Pedidos (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGINT NOT NULL DEFAULT nextval('order_number_seq'),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'delivered', 'cancelled')),
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    customer_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tabla de Ítems del Pedido (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    variant_data JSONB,
    subtotal NUMERIC(10,2) NOT NULL
);

-- 10. Tabla de Seguimiento / Oportunidades (follow_ups)
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('unconfirmed_order', 'post_purchase', 'inactive_customer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Tabla de Eventos Analíticos (analytics_events)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('store_view', 'product_view', 'cart_add', 'cart_remove', 'checkout_started', 'order_created')),
    product_id UUID,
    order_id UUID,
    session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Tabla de Suscripciones (subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
    provider TEXT NOT NULL DEFAULT 'culqi',
    provider_subscription_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Integraciones de Tienda (Pixel / Google Analytics) - Pro
CREATE TABLE IF NOT EXISTS public.store_integrations (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    google_analytics_id TEXT,
    meta_pixel_id TEXT,
    tiktok_pixel_id TEXT,
    auto_followup_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_products_store_active ON public.products(store_id, active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(store_id, slug);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON public.customers(store_id, phone);
CREATE INDEX IF NOT EXISTS idx_analytics_store_event ON public.analytics_events(store_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_store_status ON public.follow_ups(store_id, status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;

-- Stores:
-- Lectura pública para cualquier tienda por su slug
CREATE POLICY "Public can view store info" ON public.stores
    FOR SELECT USING (true);

-- Creación de tienda (en onboarding o por usuario autenticado)
CREATE POLICY "Anyone can create stores" ON public.stores
    FOR INSERT WITH CHECK (true);

-- El dueño puede modificar y ver su tienda
CREATE POLICY "Users can manage own stores" ON public.stores
    FOR ALL USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- Products:
-- Lectura pública sólo de productos activos
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (active = true);

-- Creación de productos (en onboarding o por vendedor)
CREATE POLICY "Anyone can insert products" ON public.products
    FOR INSERT WITH CHECK (true);

-- El vendedor puede ver y gestionar todos sus productos
CREATE POLICY "Sellers can manage own products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Product Images:
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product images" ON public.product_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sellers can manage product images" ON public.product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id
            WHERE products.id = product_images.product_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Product Variants:
CREATE POLICY "Public can view product variants" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert product variants" ON public.product_variants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sellers can manage product variants" ON public.product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products
            JOIN public.stores ON stores.id = products.store_id
            WHERE products.id = product_variants.product_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Customers:
-- Permite consultar y registrar clientes al realizar pedidos en el checkout
CREATE POLICY "Public can insert customers" ON public.customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can select customers for upsert" ON public.customers
    FOR SELECT USING (true);

CREATE POLICY "Public can update customer on new order" ON public.customers
    FOR UPDATE USING (true);

CREATE POLICY "Sellers can manage own customers" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = customers.store_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Orders:
-- Los compradores pueden registrar pedidos desde la tienda pública
CREATE POLICY "Public can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Comprador y vendedor pueden consultar pedidos
CREATE POLICY "Public can view created order" ON public.orders
    FOR SELECT USING (true);

-- El vendedor puede gestionar estados de pedidos
CREATE POLICY "Sellers can manage own orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = orders.store_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Order Items:
CREATE POLICY "Public can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view order items" ON public.order_items
    FOR SELECT USING (true);

CREATE POLICY "Sellers can view own order items" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders
            JOIN public.stores ON stores.id = orders.store_id
            WHERE orders.id = order_items.order_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Follow-ups:
CREATE POLICY "Public or server can insert follow ups" ON public.follow_ups
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Sellers can manage follow ups" ON public.follow_ups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = follow_ups.store_id AND (stores.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Analytics events:
-- Inserción pública (vía cliente / API sin auth de sesión)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Solo el vendedor puede leer estadísticas de su tienda
CREATE POLICY "Sellers can view analytics" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = analytics_events.store_id AND stores.user_id = auth.uid()
        )
    );

-- Subscriptions:
CREATE POLICY "Sellers can view and update subscriptions" ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = subscriptions.store_id AND stores.user_id = auth.uid()
        )
    );

-- Integrations:
CREATE POLICY "Public can view integrations for pixel scripts" ON public.store_integrations
    FOR SELECT USING (true);

CREATE POLICY "Sellers can manage integrations" ON public.store_integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = store_integrations.store_id AND stores.user_id = auth.uid()
        )
    );
