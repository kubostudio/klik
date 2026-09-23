import { PlanType } from './supabase/types';

export const PLAN_CONFIG = {
  active: {
    id: 'starter' as PlanType,
    name: 'Plan Klik',
    priceMonthly: 19.90,
    trialDays: 14,
    tagline: 'Todo lo que necesitas para vender y organizar tus pedidos por WhatsApp.',
    canUseAutomations: true,
    canUsePixels: true,
  },
};

export const PLAN_FEATURES: string[] = [
  '14 días de prueba gratis sin compromiso',
  'Catálogo online para móvil optimizado para redes sociales',
  'Productos ilimitados con fotos en carrusel y descripciones',
  'Variantes completas (tallas, colores, etc.)',
  'Pedidos directos a tu WhatsApp con desglose automático',
  '0% comisiones por tus ventas',
  'Seguimiento automático y manual de pedidos y clientes',
  'Conexión de Meta Pixel (Facebook/Instagram) y TikTok Pixel',
  'Google Analytics 4 (GA4) integrado',
  'Métricas en tiempo real: visitas, embudo y conversión',
  'Historial y base de datos de compradores',
  'Soporte prioritario y atención directa',
];

export function canAccessFeature(_plan?: PlanType, _feature?: 'automations' | 'pixels'): boolean {
  // El plan único de S/ 19.90 incluye todos los beneficios Pro
  return true;
}
