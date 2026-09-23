import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, customerName, customerDni, customerPhone, customerAddress, customerReference, voucherUrl, paymentMethod, items } = body;

    if (!storeId || !customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos para procesar el pedido.' },
        { status: 400 }
      );
    }

    // Ejecuta transacción segura en Supabase recalculando precios de BD
    const createdOrder = await createOrder({
      storeId,
      customerName,
      customerDni,
      customerPhone,
      customerAddress,
      customerReference,
      voucherUrl,
      paymentMethod,
      items,
    });

    if (!createdOrder) {
      return NextResponse.json(
        { error: 'No se pudo registrar el pedido en la base de datos.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al procesar el pedido' },
      { status: 500 }
    );
  }
}
