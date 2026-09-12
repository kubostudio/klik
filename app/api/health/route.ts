import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/db';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'No configurada';

    // 1. Probar consulta a la tabla stores
    const { data: stores, error: storesError, status: storesStatus } = await supabase
      .from('stores')
      .select('id, name, slug')
      .limit(10);

    // 2. Probar consulta a products
    const { error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    // 3. Probar consulta a orders
    const { error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    const isConnected = !storesError;

    return NextResponse.json({
      status: isConnected ? 'connected' : 'error',
      supabaseUrl,
      storesCount: stores ? stores.length : 0,
      stores: stores || [],
      checks: {
        stores: storesError ? storesError.message : 'OK (Tabla existe y responde)',
        products: productsError ? productsError.message : 'OK (Tabla existe y responde)',
        orders: ordersError ? ordersError.message : 'OK (Tabla existe y responde)',
      },
      httpStatus: storesStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'connection_failed',
        error: err.message || 'Error desconocido al conectar con Supabase',
      },
      { status: 500 }
    );
  }
}
