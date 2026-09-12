import { AnalyticsEventType } from './supabase/types';
import { getOrCreateSessionId } from './utils';

export interface TrackEventParams {
  storeId: string;
  eventType: AnalyticsEventType;
  productId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

const ANALYTICS_STORAGE_KEY = 'qori_analytics_events';

export async function trackEvent({
  storeId,
  eventType,
  productId,
  orderId,
  metadata = {},
}: TrackEventParams): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateSessionId();
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    store_id: storeId,
    event_type: eventType,
    product_id: productId || null,
    order_id: orderId || null,
    session_id: sessionId,
    metadata,
    created_at: new Date().toISOString(),
  };

  try {
    // Guardar localmente para agregación de métricas instantánea
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const events = raw ? JSON.parse(raw) : [];
    events.push(event);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events.slice(-500)));

    // Enviar a API route
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      // Ignorar fallos de red en modo offline
    });
  } catch (err) {
    console.error('Failed to track event', err);
  }
}

export function getRecordedEvents(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
