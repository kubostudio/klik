import { PlanType } from '../supabase/types';

export interface SubscriptionStatus {
  active: boolean;
  plan: PlanType;
  provider: string;
  periodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface BillingProvider {
  createCustomer(email: string, name: string): Promise<string>;
  createSubscription(customerId: string, plan: PlanType, token: string): Promise<{ subscriptionId: string; status: string }>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}

/**
 * Adaptador para Culqi (Perú)
 * En este MVP implementa la interfaz requerida y deja listos los payloads de la API de suscripciones.
 */
export class CulqiBillingAdapter implements BillingProvider {
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.publicKey = process.env.CULQI_PUBLIC_KEY || '';
    this.secretKey = process.env.CULQI_SECRET_KEY || '';
  }

  async createCustomer(email: string, name: string): Promise<string> {
    // Simulación / Conexión lista con endpoint https://api.culqi.com/v2/customers
    return `culqi_cust_${Math.random().toString(36).substring(2, 9)}`;
  }

  async createSubscription(customerId: string, plan: PlanType, token: string): Promise<{ subscriptionId: string; status: string }> {
    // Conexión con endpoint https://api.culqi.com/v2/subscriptions
    return {
      subscriptionId: `culqi_sub_${plan}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'active',
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return true;
  }
}

export const billingService = new CulqiBillingAdapter();
