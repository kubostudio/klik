-- ==============================================================================
-- MIGRATION 004: Pedidos y Clientes de Prueba para Follow-ups y Seguimiento
-- ==============================================================================
-- Este script inserta datos realistas asociados a la tienda activa para probar:
-- 1. Pedidos pendientes de confirmación (>24 horas en estado 'new')
-- 2. Clientes inactivos (>30 días sin comprar)
-- 3. Seguimiento post-compra (pedidos entregados hace 8 días)
-- 4. Pedidos confirmados y entregados con historial completo de cliente

DO $$
DECLARE
    target_store_id UUID;
    sample_prod_id UUID;
    cust_camila_id UUID;
    cust_diego_id UUID;
    cust_lucia_id UUID;
    cust_rodrigo_id UUID;
    cust_valeria_id UUID;
    order_camila_id UUID;
    order_diego_id UUID;
    order_lucia_old_id UUID;
    order_lucia_mid_id UUID;
    order_rodrigo_id UUID;
    order_valeria_id UUID;
BEGIN
    -- 1. Obtener la tienda principal existente
    SELECT id INTO target_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;

    -- Si no existe ninguna tienda, crear una por defecto
    IF target_store_id IS NULL THEN
        INSERT INTO public.stores (name, slug, whatsapp, plan, city)
        VALUES ('Mi Tienda', 'mi-tienda-demo', '+51999888777', 'starter', 'Lima')
        RETURNING id INTO target_store_id;
    END IF;

    -- 2. Obtener o crear un producto de muestra
    SELECT id INTO sample_prod_id FROM public.products WHERE store_id = target_store_id LIMIT 1;
    IF sample_prod_id IS NULL THEN
        INSERT INTO public.products (store_id, name, slug, price, category, brand, active)
        VALUES (target_store_id, 'Polo Oversize Algodón Pima', 'polo-oversize-algodon-pima', 69.00, 'Ropa', 'Klik', true)
        RETURNING id INTO sample_prod_id;
    END IF;

    -- ==========================================================================
    -- CLIENTE 1: Camila Vega (Pedido pendiente de confirmación >24h)
    -- ==========================================================================
    INSERT INTO public.customers (store_id, name, phone, address, total_orders, total_spent, last_order_at, created_at)
    VALUES (
        target_store_id,
        'Camila Vega',
        '+51987654321',
        'Av. Javier Prado Este 2450, San Borja, Lima',
        1,
        138.00,
        now() - INTERVAL '28 hours',
        now() - INTERVAL '28 hours'
    )
    ON CONFLICT (store_id, phone) DO UPDATE
    SET name = EXCLUDED.name, total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent, last_order_at = EXCLUDED.last_order_at
    RETURNING id INTO cust_camila_id;

    INSERT INTO public.orders (store_id, customer_id, status, total, customer_name, customer_phone, customer_address, customer_reference, created_at, updated_at)
    VALUES (
        target_store_id,
        cust_camila_id,
        'new',
        138.00,
        'Camila Vega',
        '+51987654321',
        'Av. Javier Prado Este 2450, San Borja',
        'Frente al centro comercial, dpto 402',
        now() - INTERVAL '28 hours',
        now() - INTERVAL '28 hours'
    )
    RETURNING id INTO order_camila_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, variant_data, subtotal)
    VALUES (
        order_camila_id,
        sample_prod_id,
        'Polo Oversize Algodón Pima',
        69.00,
        2,
        '{"Talla": "M", "Color": "Arena"}'::jsonb,
        138.00
    );

    INSERT INTO public.follow_ups (store_id, customer_id, order_id, type, status, scheduled_at, created_at)
    VALUES (
        target_store_id,
        cust_camila_id,
        order_camila_id,
        'unconfirmed_order',
        'pending',
        now() - INTERVAL '4 hours',
        now() - INTERVAL '28 hours'
    );

    -- ==========================================================================
    -- CLIENTE 2: Diego Navarro (Otro pedido pendiente >36h)
    -- ==========================================================================
    INSERT INTO public.customers (store_id, name, phone, address, total_orders, total_spent, last_order_at, created_at)
    VALUES (
        target_store_id,
        'Diego Navarro',
        '+51976543210',
        'Calle Los Pinos 180, Miraflores, Lima',
        1,
        69.00,
        now() - INTERVAL '36 hours',
        now() - INTERVAL '36 hours'
    )
    ON CONFLICT (store_id, phone) DO UPDATE
    SET name = EXCLUDED.name, total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent, last_order_at = EXCLUDED.last_order_at
    RETURNING id INTO cust_diego_id;

    INSERT INTO public.orders (store_id, customer_id, status, total, customer_name, customer_phone, customer_address, customer_reference, created_at, updated_at)
    VALUES (
        target_store_id,
        cust_diego_id,
        'new',
        69.00,
        'Diego Navarro',
        '+51976543210',
        'Calle Los Pinos 180, Miraflores',
        'Timbre 2B',
        now() - INTERVAL '36 hours',
        now() - INTERVAL '36 hours'
    )
    RETURNING id INTO order_diego_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, variant_data, subtotal)
    VALUES (
        order_diego_id,
        sample_prod_id,
        'Polo Oversize Algodón Pima',
        69.00,
        1,
        '{"Talla": "L", "Color": "Negro"}'::jsonb,
        69.00
    );

    INSERT INTO public.follow_ups (store_id, customer_id, order_id, type, status, scheduled_at, created_at)
    VALUES (
        target_store_id,
        cust_diego_id,
        order_diego_id,
        'unconfirmed_order',
        'pending',
        now() - INTERVAL '12 hours',
        now() - INTERVAL '36 hours'
    );

    -- ==========================================================================
    -- CLIENTE 3: Lucía Morales (Cliente Inactivo: Última compra hace 45 días)
    -- ==========================================================================
    INSERT INTO public.customers (store_id, name, phone, address, total_orders, total_spent, last_order_at, created_at)
    VALUES (
        target_store_id,
        'Lucía Morales',
        '+51998877665',
        'Jr. Huiracocha 1420, Jesús María, Lima',
        2,
        248.00,
        now() - INTERVAL '45 days',
        now() - INTERVAL '70 days'
    )
    ON CONFLICT (store_id, phone) DO UPDATE
    SET name = EXCLUDED.name, total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent, last_order_at = EXCLUDED.last_order_at
    RETURNING id INTO cust_lucia_id;

    -- Pedido antiguo 1 de Lucía (hace 70 días)
    INSERT INTO public.orders (store_id, customer_id, status, total, customer_name, customer_phone, customer_address, created_at, updated_at)
    VALUES (
        target_store_id,
        cust_lucia_id,
        'delivered',
        110.00,
        'Lucía Morales',
        '+51998877665',
        'Jr. Huiracocha 1420, Jesús María',
        now() - INTERVAL '70 days',
        now() - INTERVAL '68 days'
    )
    RETURNING id INTO order_lucia_old_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (order_lucia_old_id, sample_prod_id, 'Polo Oversize Algodón Pima', 55.00, 2, 110.00);

    -- Pedido antiguo 2 de Lucía (hace 45 días)
    INSERT INTO public.orders (store_id, customer_id, status, total, customer_name, customer_phone, customer_address, created_at, updated_at)
    VALUES (
        target_store_id,
        cust_lucia_id,
        'delivered',
        138.00,
        'Lucía Morales',
        '+51998877665',
        'Jr. Huiracocha 1420, Jesús María',
        now() - INTERVAL '45 days',
        now() - INTERVAL '43 days'
    )
    RETURNING id INTO order_lucia_mid_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (order_lucia_mid_id, sample_prod_id, 'Polo Oversize Algodón Pima', 69.00, 2, 138.00);

    INSERT INTO public.follow_ups (store_id, customer_id, order_id, type, status, scheduled_at, created_at)
    VALUES (
        target_store_id,
        cust_lucia_id,
        order_lucia_mid_id,
        'inactive_customer',
        'pending',
        now() - INTERVAL '15 days',
        now() - INTERVAL '45 days'
    );

    -- ==========================================================================
    -- CLIENTE 4: Rodrigo Silva (Seguimiento Post-Compra: Entregado hace 8 días)
    -- ==========================================================================
    INSERT INTO public.customers (store_id, name, phone, address, total_orders, total_spent, last_order_at, created_at)
    VALUES (
        target_store_id,
        'Rodrigo Silva',
        '+51912345678',
        'Av. Benavides 3200, Surco, Lima',
        1,
        69.00,
        now() - INTERVAL '8 days',
        now() - INTERVAL '8 days'
    )
    ON CONFLICT (store_id, phone) DO UPDATE
    SET name = EXCLUDED.name, total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent, last_order_at = EXCLUDED.last_order_at
    RETURNING id INTO cust_rodrigo_id;

    INSERT INTO public.orders (store_id, customer_id, status, total, customer_name, customer_phone, customer_address, created_at, updated_at)
    VALUES (
        target_store_id,
        cust_rodrigo_id,
        'delivered',
        69.00,
        'Rodrigo Silva',
        '+51912345678',
        'Av. Benavides 3200, Surco',
        now() - INTERVAL '8 days',
        now() - INTERVAL '8 days'
    )
    RETURNING id INTO order_rodrigo_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (order_rodrigo_id, sample_prod_id, 'Polo Oversize Algodón Pima', 69.00, 1, 69.00);

    INSERT INTO public.follow_ups (store_id, customer_id, order_id, type, status, scheduled_at, created_at)
    VALUES (
        target_store_id,
        cust_rodrigo_id,
        order_rodrigo_id,
        'post_purchase',
        'pending',
        now() - INTERVAL '1 day',
        now() - INTERVAL '8 days'
    );

    -- ==========================================================================
    -- CLIENTE 5: Valeria Ríos (Pedido Confirmado en despacho hace 1 día)
    -- ==========================================================================
    INSERT INTO public.customers (store_id, name, phone, address, total_orders, total_spent, last_order_at, created_at)
    VALUES (
        target_store_id,
        'Valeria Ríos',
        '+51934567890',
        'Calle Manuel Tovar 450, San Isidro, Lima',
        1,
        207.00,
        now() - INTERVAL '1 day',
        now() - INTERVAL '1 day'
    )
    ON CONFLICT (store_id, phone) DO UPDATE
    SET name = EXCLUDED.name, total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent, last_order_at = EXCLUDED.last_order_at
    RETURNING id INTO cust_valeria_id;

    INSERT INTO public.orders (store_id, customer_id, status, total, customer_name, customer_phone, customer_address, created_at, updated_at)
    VALUES (
        target_store_id,
        cust_valeria_id,
        'confirmed',
        207.00,
        'Valeria Ríos',
        '+51934567890',
        'Calle Manuel Tovar 450, San Isidro',
        now() - INTERVAL '1 day',
        now() - INTERVAL '12 hours'
    )
    RETURNING id INTO order_valeria_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (order_valeria_id, sample_prod_id, 'Polo Oversize Algodón Pima', 69.00, 3, 207.00);

    RAISE NOTICE 'Datos de prueba para seguimiento y pedidos insertados correctamente en la tienda %', target_store_id;
END $$;
