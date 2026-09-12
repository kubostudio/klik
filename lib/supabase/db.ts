import { createClient } from './client';
import { deleteStorageImages } from './storage';
import {
  sanitizeStoreName,
  sanitizeEmail,
  sanitizeInstagram,
  sanitizePhone,
  sanitizeText,
  sanitizeUrl,
} from '@/lib/security/sanitize';
import {
  Store,
  Product,
  ProductImage,
  ProductVariant,
  Order,
  OrderItem,
  Customer,
  FollowUp,
  StoreIntegration,
  OrderStatus,
  PlanType,
  AnalyticsEventType,
} from './types';

export const supabase = createClient();

// ==============================================================================
// STORES
// ==============================================================================

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as Store;
  } catch (err) {
    console.error('Error fetching store by slug:', err);
    return null;
  }
}

export async function getCurrentStore(): Promise<Store | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as Store;
    }

    // Fallback por si hay sesión local de onboarding
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qori_current_store_id');
      if (stored) {
        const { data } = await supabase.from('stores').select('*').eq('id', stored).maybeSingle();
        if (data) return data as Store;
      }
    }

    // Si aún no hay sesión o localStorage pero hay tiendas en Supabase, tomar la última tienda creada
    const { data: latestStore } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestStore) {
      return latestStore as Store;
    }

    return null;
  } catch (err) {
    console.error('Error fetching current store:', err);
    return null;
  }
}

export interface StoreUniquenessCheck {
  name?: string;
  slug?: string;
  instagram?: string | null;
  email?: string | null;
  excludeStoreId?: string;
}

export interface StoreUniquenessResult {
  available: boolean;
  nameTaken: boolean;
  slugTaken: boolean;
  instagramTaken: boolean;
  emailTaken: boolean;
  field?: 'name' | 'slug' | 'instagram' | 'email';
  message?: string;
}

/**
 * Valida si el nombre de la tienda, usuario de Instagram o correo ya existen en Supabase.
 */
export async function checkStoreUniqueness(params: StoreUniquenessCheck): Promise<StoreUniquenessResult> {
  const result: StoreUniquenessResult = {
    available: true,
    nameTaken: false,
    slugTaken: false,
    instagramTaken: false,
    emailTaken: false,
  };

  try {
    // 1. Verificar nombre de tienda (case-insensitive)
    if (params.name && params.name.trim()) {
      const cleanName = params.name.trim();
      let q = supabase
        .from('stores')
        .select('id, name')
        .ilike('name', cleanName);

      if (params.excludeStoreId) {
        q = q.neq('id', params.excludeStoreId);
      }

      const { data } = await q.limit(1);
      if (data && data.length > 0) {
        result.nameTaken = true;
        result.available = false;
        result.field = 'name';
        result.message = `El nombre "${cleanName}" ya está registrado por otra tienda. Elige un nombre diferente.`;
        return result;
      }
    }

    // 2. Verificar slug (enlace web de la tienda)
    if (params.slug && params.slug.trim()) {
      const cleanSlug = params.slug.trim().toLowerCase();
      let q = supabase
        .from('stores')
        .select('id, slug')
        .eq('slug', cleanSlug);

      if (params.excludeStoreId) {
        q = q.neq('id', params.excludeStoreId);
      }

      const { data } = await q.limit(1);
      if (data && data.length > 0) {
        result.slugTaken = true;
        result.available = false;
        result.field = 'slug';
        result.message = `El enlace web "qori.business/${cleanSlug}" ya está en uso. Modifica el nombre de la tienda.`;
        return result;
      }
    }

    // 3. Verificar usuario de Instagram (case-insensitive, omitiendo @)
    if (params.instagram && params.instagram.trim()) {
      const cleanInsta = params.instagram.replace(/^@/, '').trim().toLowerCase();
      if (cleanInsta) {
        let q = supabase
          .from('stores')
          .select('id, instagram')
          .ilike('instagram', cleanInsta);

        if (params.excludeStoreId) {
          q = q.neq('id', params.excludeStoreId);
        }

        const { data } = await q.limit(1);
        if (data && data.length > 0) {
          result.instagramTaken = true;
          result.available = false;
          result.field = 'instagram';
          result.message = `El usuario de Instagram "@${cleanInsta}" ya está registrado en otra tienda.`;
          return result;
        }
      }
    }

    // 4. Verificar correo electrónico (case-insensitive)
    if (params.email && params.email.trim()) {
      const cleanEmail = params.email.trim().toLowerCase();
      let q = supabase
        .from('stores')
        .select('id, email')
        .ilike('email', cleanEmail);

      if (params.excludeStoreId) {
        q = q.neq('id', params.excludeStoreId);
      }

      const { data } = await q.limit(1);
      if (data && data.length > 0) {
        result.emailTaken = true;
        result.available = false;
        result.field = 'email';
        result.message = `El correo electrónico "${cleanEmail}" ya está registrado por otra tienda.`;
        return result;
      }
    }

    return result;
  } catch (err) {
    console.error('Error in checkStoreUniqueness:', err);
    return result;
  }
}

export async function createStore(storeData: {
  name: string;
  slug: string;
  email?: string | null;
  description?: string | null;
  logo_url?: string | null;
  whatsapp: string;
  instagram?: string | null;
  facebook?: string | null;
  city?: string | null;
  plan?: PlanType;
}): Promise<Store | null> {
  try {
    // Sanitización exhaustiva
    const cleanName = sanitizeStoreName(storeData.name);
    const cleanEmail = storeData.email ? sanitizeEmail(storeData.email) : null;
    const cleanInstagram = storeData.instagram ? sanitizeInstagram(storeData.instagram) : null;
    const cleanWhatsapp = sanitizePhone(storeData.whatsapp);
    const cleanDescription = sanitizeText(storeData.description, 500) || null;
    const cleanCity = sanitizeText(storeData.city, 60) || null;
    const cleanLogoUrl = sanitizeUrl(storeData.logo_url);
    const cleanSlug = storeData.slug.toLowerCase().trim();

    // Verificación de unicidad en BD
    const uniqueness = await checkStoreUniqueness({
      name: cleanName,
      slug: cleanSlug,
      instagram: cleanInstagram,
      email: cleanEmail,
    });

    if (!uniqueness.available) {
      throw new Error(uniqueness.message || 'Algunos datos ingresados ya se encuentran registrados.');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const newStore = {
      user_id: user?.id || null,
      name: cleanName,
      slug: cleanSlug,
      email: cleanEmail,
      description: cleanDescription,
      logo_url: cleanLogoUrl,
      whatsapp: cleanWhatsapp,
      instagram: cleanInstagram,
      facebook: sanitizeText(storeData.facebook, 120) || null,
      city: cleanCity,
      plan: storeData.plan || 'starter',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('stores').insert(newStore).select().single();

    if (error) {
      console.error('Error creating store in Supabase:', error);
      if (error.code === '23505') {
        throw new Error('El nombre de tienda, usuario de Instagram o correo ya existe en la plataforma.');
      }
      throw new Error(error.message || 'Error al guardar la tienda en la base de datos.');
    }

    if (typeof window !== 'undefined' && data?.id) {
      localStorage.setItem('qori_current_store_id', data.id);
    }

    return data as Store;
  } catch (err: any) {
    console.error('Error in createStore:', err);
    throw err;
  }
}

export async function updateStore(
  storeId: string,
  updates: Partial<Store>
): Promise<Store | null> {
  try {
    // Si se actualiza el logo, eliminar el anterior de Supabase Storage
    if (updates.logo_url !== undefined) {
      const { data: currentStore } = await supabase
        .from('stores')
        .select('logo_url')
        .eq('id', storeId)
        .maybeSingle();

      if (currentStore?.logo_url && currentStore.logo_url !== updates.logo_url) {
        await deleteStorageImages([currentStore.logo_url]);
      }
    }

    const { data, error } = await supabase
      .from('stores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating store:', error);
      return null;
    }
    return data as Store;
  } catch (err) {
    console.error('Error in updateStore:', err);
    return null;
  }
}

// ==============================================================================
// PRODUCTS
// ==============================================================================

export async function getProducts(
  storeId: string,
  onlyActive: boolean = false
): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('store_id', storeId);

    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      ...item,
      variants: item.product_variants || [],
      images: item.product_images || [],
    })) as Product[];
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function getProductBySlug(
  storeId: string,
  slug: string
): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      variants: data.product_variants || [],
      images: data.product_images || [],
    } as Product;
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    return null;
  }
}

export function getAllProductImages(product?: { image_url?: string | null; images?: ProductImage[] } | null): string[] {
  if (!product) return [];
  const list: string[] = [];
  if (product.image_url) {
    list.push(product.image_url);
  }
  if (product.images && product.images.length > 0) {
    const extra = [...product.images]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((img) => img.url)
      .filter((url) => Boolean(url) && !list.includes(url));
    list.push(...extra);
  }
  return list;
}

export async function createProduct(
  productData: {
    store_id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    category?: string;
    brand?: string | null;
    active?: boolean;
  },
  variants: Array<{ name: string; value: string }> = [],
  additionalImages: string[] = []
): Promise<Product | null> {
  try {
    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({
        store_id: productData.store_id,
        name: productData.name,
        slug: productData.slug,
        description: productData.description || null,
        price: productData.price,
        image_url: productData.image_url || null,
        category: productData.category || 'General',
        brand: productData.brand || null,
        active: productData.active !== undefined ? productData.active : true,
      })
      .select()
      .single();

    if (prodError || !product) {
      console.error('Error creating product:', prodError);
      return null;
    }

    if (variants.length > 0) {
      const variantRows = variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        value: v.value,
      }));
      await supabase.from('product_variants').insert(variantRows);
    }

    if (additionalImages.length > 0) {
      const imageRows = additionalImages.map((url, idx) => ({
        product_id: product.id,
        url,
        sort_order: idx + 1,
      }));
      await supabase.from('product_images').insert(imageRows);
    }

    return await getProductBySlug(productData.store_id, productData.slug);
  } catch (err) {
    console.error('Error in createProduct:', err);
    return null;
  }
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product>,
  variants?: Array<{ name: string; value: string }>,
  additionalImages?: string[]
): Promise<Product | null> {
  try {
    // 1. Obtener imágenes anteriores para eliminar de storage las que hayan sido reemplazadas o quitadas
    const { data: existing } = await supabase
      .from('products')
      .select('image_url, product_images(url)')
      .eq('id', productId)
      .maybeSingle();

    if (existing) {
      const oldUrls: string[] = [];
      if (existing.image_url) oldUrls.push(existing.image_url);
      if (existing.product_images && Array.isArray(existing.product_images)) {
        existing.product_images.forEach((pi: any) => {
          if (pi.url) oldUrls.push(pi.url);
        });
      }

      // Determinar cuáles imágenes se conservan en la nueva versión
      const keptMainImage = updates.image_url !== undefined ? updates.image_url : existing.image_url;
      const keptAdditional = additionalImages !== undefined
        ? additionalImages
        : (existing.product_images?.map((pi: any) => pi.url) || []);

      const newUrls = [keptMainImage, ...keptAdditional].filter(Boolean) as string[];

      // Imágenes que estaban antes y ya no están
      const removedUrls = oldUrls.filter((oldUrl) => !newUrls.includes(oldUrl));
      if (removedUrls.length > 0) {
        await deleteStorageImages(removedUrls);
      }
    }

    // 2. Actualizar producto en la base de datos
    const { data: updated, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();

    if (error || !updated) {
      console.error('Error updating product:', error);
      return null;
    }

    if (variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', productId);
      if (variants.length > 0) {
        const variantRows = variants.map((v) => ({
          product_id: productId,
          name: v.name,
          value: v.value,
        }));
        await supabase.from('product_variants').insert(variantRows);
      }
    }

    if (additionalImages !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', productId);
      if (additionalImages.length > 0) {
        const imageRows = additionalImages.map((url, idx) => ({
          product_id: productId,
          url,
          sort_order: idx + 1,
        }));
        await supabase.from('product_images').insert(imageRows);
      }
    }

    return await getProductBySlug(updated.store_id, updated.slug);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    return null;
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    // 1. Obtener todas las fotos del producto para eliminarlas de Supabase Storage
    const { data: product } = await supabase
      .from('products')
      .select('image_url, product_images(url)')
      .eq('id', productId)
      .maybeSingle();

    if (product) {
      const urlsToDelete: string[] = [];
      if (product.image_url) urlsToDelete.push(product.image_url);
      if (product.product_images && Array.isArray(product.product_images)) {
        product.product_images.forEach((pi: any) => {
          if (pi.url) urlsToDelete.push(pi.url);
        });
      }

      if (urlsToDelete.length > 0) {
        await deleteStorageImages(urlsToDelete);
      }
    }

    // 2. Eliminar de la base de datos (variants y product_images se borran en cascada)
    const { error } = await supabase.from('products').delete().eq('id', productId);
    return !error;
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    return false;
  }
}

// ==============================================================================
// ORDERS
// ==============================================================================

export async function getOrders(
  storeId: string,
  statusFilter?: string
): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('store_id', storeId);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      ...item,
      items: item.order_items || [],
    })) as Order[];
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      items: data.order_items || [],
    } as Order;
  } catch (err) {
    console.error('Error fetching order by id:', err);
    return null;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return !error;
  } catch (err) {
    console.error('Error updating order status:', err);
    return false;
  }
}

export async function createOrder(payload: {
  storeId: string;
  customerName: string;
  customerDni?: string;
  customerPhone: string;
  customerAddress?: string;
  customerReference?: string;
  items: Array<{
    productId: string;
    quantity: number;
    variantData?: Record<string, string>;
  }>;
}): Promise<Order | null> {
  try {
    // 1. Recalcular precios desde la base de datos (seguridad server-side)
    const productIds = payload.items.map((i) => i.productId);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const productsMap = new Map((dbProducts || []).map((p: any) => [p.id, p]));

    let total = 0;
    const itemsToInsert = payload.items.map((item) => {
      const prod = productsMap.get(item.productId);
      const unitPrice = prod ? Number(prod.price) : 0;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      return {
        product_id: item.productId,
        product_name: prod ? prod.name : 'Producto',
        unit_price: unitPrice,
        quantity: item.quantity,
        variant_data: item.variantData || null,
        subtotal,
      };
    });

    // 2. Upsert del cliente por (store_id, phone)
    const cleanPhone = payload.customerPhone.trim();
    const cleanDni = payload.customerDni ? payload.customerDni.trim() : null;

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', payload.storeId)
      .eq('phone', cleanPhone)
      .maybeSingle();

    let customerId = existingCustomer?.id;
    const now = new Date().toISOString();

    if (existingCustomer) {
      const customerUpdateData: Record<string, any> = {
        name: payload.customerName,
        address: payload.customerAddress || existingCustomer.address,
        total_orders: (existingCustomer.total_orders || 0) + 1,
        total_spent: Number(existingCustomer.total_spent || 0) + total,
        last_order_at: now,
      };
      if (cleanDni) {
        customerUpdateData.dni = cleanDni;
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update(customerUpdateData)
        .eq('id', existingCustomer.id);

      if (updateError && updateError.message?.includes('dni')) {
        delete customerUpdateData.dni;
        await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', existingCustomer.id);
      }
    } else {
      const customerInsertData: Record<string, any> = {
        store_id: payload.storeId,
        name: payload.customerName,
        phone: cleanPhone,
        address: payload.customerAddress || null,
        total_orders: 1,
        total_spent: total,
        last_order_at: now,
        created_at: now,
      };
      if (cleanDni) {
        customerInsertData.dni = cleanDni;
      }

      let { data: newCust, error: insertCustError } = await supabase
        .from('customers')
        .insert(customerInsertData)
        .select()
        .single();

      if (insertCustError && insertCustError.message?.includes('dni')) {
        delete customerInsertData.dni;
        const fallback = await supabase
          .from('customers')
          .insert(customerInsertData)
          .select()
          .single();
        newCust = fallback.data;
      }

      if (newCust) customerId = newCust.id;
    }

    // 3. Crear orden
    const orderInsertData: Record<string, any> = {
      store_id: payload.storeId,
      customer_id: customerId || null,
      status: 'new',
      total,
      customer_name: payload.customerName,
      customer_phone: cleanPhone,
      customer_address: payload.customerAddress || null,
      customer_reference: payload.customerReference || null,
      created_at: now,
      updated_at: now,
    };
    if (cleanDni) {
      orderInsertData.customer_dni = cleanDni;
    }

    let { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError && orderError.message?.includes('customer_dni')) {
      delete orderInsertData.customer_dni;
      const fallbackOrder = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();
      order = fallbackOrder.data;
      orderError = fallbackOrder.error;
    }

    if (orderError || !order) {
      console.error('Error inserting order:', orderError);
      return null;
    }

    // 4. Crear order_items
    const orderItemsRows = itemsToInsert.map((item) => ({
      ...item,
      order_id: order.id,
    }));
    await supabase.from('order_items').insert(orderItemsRows);

    // 5. Crear follow_up pendiente
    if (customerId) {
      await supabase.from('follow_ups').insert({
        store_id: payload.storeId,
        customer_id: customerId,
        order_id: order.id,
        type: 'unconfirmed_order',
        status: 'pending',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: now,
      });
    }

    // 6. Registrar analítica
    await recordAnalyticsEvent({
      storeId: payload.storeId,
      eventType: 'order_created',
      orderId: order.id,
      metadata: { total, orderNumber: order.order_number },
    });

    return await getOrderById(order.id);
  } catch (err) {
    console.error('Error in createOrder:', err);
    return null;
  }
}

// ==============================================================================
// CUSTOMERS
// ==============================================================================

export async function getCustomers(storeId: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .order('last_order_at', { ascending: false, nullsFirst: false });

    if (error || !data) return [];
    return data as Customer[];
  } catch (err) {
    console.error('Error fetching customers:', err);
    return [];
  }
}

// ==============================================================================
// FOLLOW-UPS
// ==============================================================================

export async function getFollowUps(storeId: string): Promise<FollowUp[]> {
  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, customers(*), orders(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      ...item,
      customer: item.customers,
      order: item.orders,
    })) as FollowUp[];
  } catch (err) {
    console.error('Error fetching follow-ups:', err);
    return [];
  }
}

// ==============================================================================
// STORE INTEGRATIONS (Pixel / Analytics)
// ==============================================================================

export async function getStoreIntegration(storeId: string): Promise<StoreIntegration | null> {
  try {
    const { data, error } = await supabase
      .from('store_integrations')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error || !data) return null;
    return data as StoreIntegration;
  } catch (err) {
    console.error('Error fetching store integration:', err);
    return null;
  }
}

export async function saveStoreIntegration(
  storeId: string,
  integrationData: Partial<StoreIntegration>
): Promise<StoreIntegration | null> {
  try {
    const { data, error } = await supabase
      .from('store_integrations')
      .upsert({
        store_id: storeId,
        ...integrationData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving store integration:', error);
      return null;
    }
    return data as StoreIntegration;
  } catch (err) {
    console.error('Error in saveStoreIntegration:', err);
    return null;
  }
}

// ==============================================================================
// ANALYTICS EVENTS
// ==============================================================================

export async function recordAnalyticsEvent(params: {
  storeId: string;
  eventType: AnalyticsEventType;
  productId?: string;
  orderId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      store_id: params.storeId,
      event_type: params.eventType,
      product_id: params.productId || null,
      order_id: params.orderId || null,
      session_id: params.sessionId || null,
      metadata: params.metadata || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error inserting analytics event:', err);
  }
}

export async function getAnalyticsSummary(storeId: string): Promise<{
  storeViews: number;
  productViews: number;
  cartAdds: number;
  totalOrders: number;
  totalSales: number;
  conversionRate: string;
}> {
  try {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type')
      .eq('store_id', storeId);

    const { data: orders } = await supabase
      .from('orders')
      .select('total, status')
      .eq('store_id', storeId);

    const storeViews = (events || []).filter((e: any) => e.event_type === 'store_view').length;
    const productViews = (events || []).filter((e: any) => e.event_type === 'product_view').length;
    const cartAdds = (events || []).filter((e: any) => e.event_type === 'cart_add').length;

    const validOrders = (orders || []).filter((o: any) => o.status !== 'cancelled');
    const totalOrders = validOrders.length;
    const totalSales = validOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
    const conversionRate = storeViews > 0 ? ((totalOrders / storeViews) * 100).toFixed(1) : '0.0';

    return {
      storeViews,
      productViews,
      cartAdds,
      totalOrders,
      totalSales,
      conversionRate,
    };
  } catch (err) {
    console.error('Error fetching analytics summary:', err);
    return {
      storeViews: 0,
      productViews: 0,
      cartAdds: 0,
      totalOrders: 0,
      totalSales: 0,
      conversionRate: '0.0',
    };
  }
}
