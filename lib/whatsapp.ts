import { Order, OrderStatus } from './supabase/types';
import { formatCurrency } from './utils';

/**
 * Normaliza un número telefónico eliminando caracteres no numéricos y asegurando el prefijo 51 (Perú).
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) {
    return digits;
  }
  if (digits.length === 9) {
    return `51${digits}`;
  }
  return digits;
}

/**
 * Genera el enlace de WhatsApp para que el comprador envíe su pedido al vendedor.
 */
export function buildCustomerOrderWhatsAppUrl(
  storePhone: string,
  storeName: string,
  order: Order
): string {
  const cleanPhone = normalizePhoneNumber(storePhone);

  const lines: string[] = [
    `Hola, hice el pedido *#${order.order_number}* en Klik para *${storeName}*.`,
    '',
    '*Mi pedido:*',
  ];

  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      lines.push(`• *${item.product_name}* (x${item.quantity}) - ${formatCurrency(item.subtotal)}`);
      if (item.variant_data && Object.keys(item.variant_data).length > 0) {
        const variants = Object.entries(item.variant_data)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        lines.push(`  _${variants}_`);
      }
    });
  }

  lines.push('');
  lines.push(`*Total:* ${formatCurrency(order.total)}`);

  if (order.customer_name) {
    lines.push(`*Cliente:* ${order.customer_name}`);
  }
  if (order.customer_dni) {
    lines.push(`*DNI:* ${order.customer_dni}`);
  }
  if (order.customer_address) {
    lines.push(`*Dirección de entrega:* ${order.customer_address}`);
  }
  if (order.customer_reference) {
    lines.push(`*Referencia:* ${order.customer_reference}`);
  }

  lines.push('');
  lines.push('Quiero confirmar mi compra.');

  const encodedText = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Genera el texto del mensaje según el estado actual de la orden siguiendo las reglas de seguimiento:
 * - Nuevo: Mensaje inicial de coordinación de pago y entrega.
 * - Contactado: Comunica que el pedido ha sido confirmado y se prepara (referencia al siguiente estado).
 * - Confirmado: Comunica que ya está en proceso de entrega hacia la dirección (referencia al siguiente estado).
 * - Entregado: Comunica que fue entregado y agradece la preferencia usando Klik y la tienda.
 * - Cancelado: Informa el estado cancelado e incita amablemente a realizar una compra después.
 */
export function getOrderStatusMessageText(
  customerName: string,
  storeName: string,
  orderNumber: number,
  status: OrderStatus = 'new'
): string {
  switch (status) {
    case 'new':
      return `Hola ${customerName}, te escribo de *${storeName}* respecto a tu pedido *#${orderNumber}* en Klik. ¿Deseas coordinar el pago y la entrega?`;

    case 'contacted':
      return `Hola ${customerName}, te escribo de *${storeName}*. ¡Buenas noticias! Tu pedido *#${orderNumber}* ha sido confirmado y ya lo estamos preparando para su despacho. Te avisaremos en cuanto esté en camino a tu dirección.`;

    case 'confirmed':
      return `Hola ${customerName}, te escribo de *${storeName}*. Tu pedido *#${orderNumber}* ya se encuentra en proceso de entrega hacia tu dirección. Nuestro repartidor está coordinando la llegada para que lo recibas sin inconvenientes. ¡Muchas gracias por tu espera!`;

    case 'delivered':
      return `Hola ${customerName}, te saludamos de *${storeName}*. Confirmamos que tu pedido *#${orderNumber}* ha sido entregado exitosamente. Queremos agradecerte por tu preferencia y por confiar en *${storeName}* a través de nuestra tienda online en Klik. ¡Esperamos que disfrutes mucho tu compra y verte pronto de vuelta!`;

    case 'cancelled':
      return `Hola ${customerName}, te escribo de *${storeName}*. Te informamos que tu pedido *#${orderNumber}* ha sido cancelado. Si tuviste algún inconveniente o deseas realizar una compra más adelante, nuestro catálogo sigue disponible para ti cuando gustes. ¡Estaremos encantados de atenderte en tu próxima visita!`;

    default:
      return `Hola ${customerName}, te escribo de *${storeName}* sobre tu pedido *#${orderNumber}* en Klik.`;
  }
}

/**
 * Genera el enlace de WhatsApp para que el vendedor contacte al comprador según el estado de la orden.
 */
export function buildSellerContactWhatsAppUrl(
  customerPhone: string,
  customerName: string,
  storeName: string,
  orderNumber: number,
  status: OrderStatus = 'new'
): string {
  const cleanPhone = normalizePhoneNumber(customerPhone);
  const message = getOrderStatusMessageText(customerName, storeName, orderNumber, status);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Retorna la etiqueta descriptiva de la acción de WhatsApp según el estado.
 */
export function getStatusWhatsAppActionLabel(status: OrderStatus): string {
  switch (status) {
    case 'new':
      return 'Coordinar pago';
    case 'contacted':
      return 'Avisar confirmación';
    case 'confirmed':
      return 'Avisar despacho/entrega';
    case 'delivered':
      return 'Agradecer entrega';
    case 'cancelled':
      return 'Notificar cancelación';
    default:
      return 'WhatsApp';
  }
}

/**
 * Genera el enlace para seguimiento manual (Follow-ups).
 */
export function buildFollowUpWhatsAppUrl(
  customerPhone: string,
  customerName: string,
  storeName: string,
  reason: 'pending_order' | 'inactive_customer' | 'post_purchase',
  orderNumber?: number
): string {
  const cleanPhone = normalizePhoneNumber(customerPhone);
  let message = '';
  if (reason === 'pending_order') {
    message = `Hola ${customerName}, te saludamos de *${storeName}*. Notamos que tienes un pedido pendiente de confirmación en nuestra tienda. ¿Tienes alguna duda o deseas que te ayudemos a completarlo?`;
  } else if (reason === 'post_purchase') {
    message = `Hola ${customerName}, te escribimos de *${storeName}* sobre tu pedido *#${orderNumber || ''}*. Ya pasaron unos días desde que lo recibiste y nos encantaría saber: ¿qué tal te pareció tu compra y la atención recibida? ¡Tu opinión es muy valiosa para nosotros!`;
  } else {
    message = `Hola ${customerName}, te saludamos de *${storeName}*. Hace un tiempo que no nos visitas y tenemos novedades en nuestro catálogo. ¡Te dejamos nuestro link para que eches un vistazo!`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
