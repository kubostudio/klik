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
  StoreBillingInfo,
  SalesDataPoint,
  TopProduct,
  LowStockProduct,
  ProductSortMode,
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
    const store = data as Store;
    if (!store.product_sort_mode && typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(`klik_store_sort_mode_${store.id}`) as ProductSortMode | null;
      if (savedMode) store.product_sort_mode = savedMode;
    }
    return store;
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

    let foundStore: Store | null = null;

    if (user) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) foundStore = data as Store;
    }

    // Fallback por si hay sesión local de onboarding
    if (!foundStore && typeof window !== 'undefined') {
      const stored = localStorage.getItem('klik_current_store_id') || localStorage.getItem('qori_current_store_id');
      if (stored) {
        const { data } = await supabase.from('stores').select('*').eq('id', stored).maybeSingle();
        if (data) foundStore = data as Store;
      }
    }

    // Si aún no hay sesión o localStorage pero hay tiendas en Supabase, tomar la última tienda creada
    if (!foundStore) {
      const { data: latestStore } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestStore) {
        foundStore = latestStore as Store;
      }
    }

    if (foundStore && !foundStore.product_sort_mode && typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(`klik_store_sort_mode_${foundStore.id}`) as ProductSortMode | null;
      if (savedMode) foundStore.product_sort_mode = savedMode;
    }

    return foundStore;
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
      is_active: false,
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

    if (typeof window !== 'undefined' && updates.product_sort_mode) {
      localStorage.setItem(`klik_store_sort_mode_${storeId}`, updates.product_sort_mode);
    }

    const { data, error } = await supabase
      .from('stores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      console.warn('Notice: Error updating store in Supabase, checking fallback:', error.message);
      // Si el error es por columna inexistente (aún no migrada), reintentar sin ella
      if (error.message?.includes('product_sort_mode')) {
        const safeUpdates = { ...updates };
        delete safeUpdates.product_sort_mode;
        const retry = await supabase.from('stores').update({ ...safeUpdates, updated_at: new Date().toISOString() }).eq('id', storeId).select().maybeSingle();
        if (retry.data) {
          return { ...retry.data, product_sort_mode: updates.product_sort_mode } as Store;
        }
      }
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
  onlyActive: boolean = false,
  sortMode?: ProductSortMode
): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('store_id', storeId);

    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    let prods = data.map((item: any) => {
      let onDemand = item.on_demand;
      if ((onDemand === undefined || onDemand === null) && typeof window !== 'undefined') {
        const storedOD = localStorage.getItem(`klik_product_on_demand_${item.id}`);
        if (storedOD !== null) onDemand = storedOD === 'true';
      }
      return {
        ...item,
        on_demand: Boolean(onDemand),
        variants: item.product_variants || [],
        images: item.product_images || [],
      };
    }) as Product[];

    // Fallback local de orden manual si existe
    let fallbackOrder: string[] | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`klik_sort_order_${storeId}`);
        if (stored) fallbackOrder = JSON.parse(stored);
      } catch (e) {}
    }

    // Determinar modo de orden activo
    let effectiveMode = sortMode;
    if (!effectiveMode && typeof window !== 'undefined') {
      const storedMode = localStorage.getItem(`klik_store_sort_mode_${storeId}`) as ProductSortMode | null;
      if (storedMode) effectiveMode = storedMode;
    }
    if (!effectiveMode) {
      effectiveMode = 'custom';
    }

    // Aplicar orden según el modo
    if (effectiveMode === 'name_asc') {
      prods.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    } else if (effectiveMode === 'name_desc') {
      prods.sort((a, b) => b.name.localeCompare(a.name, 'es', { sensitivity: 'base' }));
    } else if (effectiveMode === 'price_asc') {
      prods.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (effectiveMode === 'price_desc') {
      prods.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      // Modo 'custom': primero por sort_order, luego por created_at más reciente
      prods.sort((a, b) => {
        let orderA = a.sort_order ?? null;
        let orderB = b.sort_order ?? null;

        if ((orderA === null || orderA === undefined) && fallbackOrder) {
          const idxA = fallbackOrder.indexOf(a.id);
          if (idxA !== -1) orderA = idxA;
        }
        if ((orderB === null || orderB === undefined) && fallbackOrder) {
          const idxB = fallbackOrder.indexOf(b.id);
          if (idxB !== -1) orderB = idxB;
        }

        const valA = orderA !== null && orderA !== undefined ? orderA : 999999;
        const valB = orderB !== null && orderB !== undefined ? orderB : 999999;

        if (valA !== valB) return valA - valB;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    }

    return prods;
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

/**
 * Actualiza el orden personalizado (sort_order) de los productos de una tienda.
 */
export async function updateProductsOrder(
  storeId: string,
  orderedProductIds: string[]
): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`klik_sort_order_${storeId}`, JSON.stringify(orderedProductIds));
    }

    // Actualizar cada producto con su posición en la base de datos
    const updates = orderedProductIds.map((id, index) =>
      supabase
        .from('products')
        .update({ sort_order: index })
        .eq('id', id)
    );

    await Promise.all(updates);
    return true;
  } catch (err) {
    console.warn('Error persisting sort_order in Supabase, saved locally as fallback:', err);
    return false;
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

    let onDemand = data.on_demand;
    if ((onDemand === undefined || onDemand === null) && typeof window !== 'undefined') {
      const storedOD = localStorage.getItem(`klik_product_on_demand_${data.id}`);
      if (storedOD !== null) onDemand = storedOD === 'true';
    }

    return {
      ...data,
      on_demand: Boolean(onDemand),
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
    stock?: number | null;
    show_stock?: boolean | null;
    show_price?: boolean | null;
    on_demand?: boolean | null;
  },
  variants: Array<{ name: string; value: string }> = [],
  additionalImages: string[] = []
): Promise<Product | null> {
  try {
    const insertPayload: Record<string, any> = {
      store_id: productData.store_id,
      name: productData.name,
      slug: productData.slug,
      description: productData.description || null,
      price: productData.price,
      image_url: productData.image_url || null,
      category: productData.category || 'General',
      brand: productData.brand || null,
      active: productData.active !== undefined ? productData.active : true,
      stock: productData.stock !== undefined ? productData.stock : null,
      show_stock: productData.show_stock !== undefined ? productData.show_stock : true,
      show_price: productData.show_price !== undefined ? productData.show_price : true,
      on_demand: productData.on_demand !== undefined ? productData.on_demand : false,
    };

    let { data: product, error: prodError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (prodError && (prodError.message?.includes('show_stock') || prodError.message?.includes('show_price') || prodError.message?.includes('on_demand'))) {
      if (prodError.message?.includes('on_demand')) delete insertPayload.on_demand;
      if (prodError.message?.includes('show_stock')) delete insertPayload.show_stock;
      if (prodError.message?.includes('show_price')) delete insertPayload.show_price;
      const fallback = await supabase
        .from('products')
        .insert(insertPayload)
        .select()
        .single();
      product = fallback.data;
      prodError = fallback.error;
    }

    if (prodError || !product) {
      console.error('Error creating product:', prodError);
      return null;
    }

    if (productData.on_demand !== undefined && typeof window !== 'undefined') {
      localStorage.setItem(`klik_product_on_demand_${product.id}`, String(productData.on_demand));
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
    let updatePayload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
    let { data: updated, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select()
      .single();

    if (error && (error.message?.includes('on_demand') || error.message?.includes('show_stock') || error.message?.includes('show_price'))) {
      if (error.message?.includes('on_demand')) delete updatePayload.on_demand;
      if (error.message?.includes('show_stock')) delete updatePayload.show_stock;
      if (error.message?.includes('show_price')) delete updatePayload.show_price;
      const fallback = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', productId)
        .select()
        .single();
      updated = fallback.data;
      error = fallback.error;
    }

    if (updates.on_demand !== undefined && typeof window !== 'undefined') {
      localStorage.setItem(`klik_product_on_demand_${productId}`, String(updates.on_demand));
    }

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
  voucherUrl?: string;
  paymentMethod?: string;
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

    // Validar disponibilidad de stock: no permitir comprar más del stock actual
    for (const item of payload.items) {
      const prod = productsMap.get(item.productId);
      if (prod && prod.stock !== null && prod.stock !== undefined) {
        if (prod.stock <= 0) {
          throw new Error(`El producto "${prod.name}" se encuentra agotado.`);
        }
        if (item.quantity > prod.stock) {
          throw new Error(
            `No es posible comprar más del stock disponible. "${prod.name}" cuenta con ${prod.stock} unidad(es) en inventario y solicitaste ${item.quantity}.`
          );
        }
      }
    }

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
      voucher_url: payload.voucherUrl || null,
      payment_method: payload.paymentMethod || null,
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

    if (orderError && (orderError.message?.includes('customer_dni') || orderError.message?.includes('voucher_url') || orderError.message?.includes('payment_method'))) {
      if (orderError.message?.includes('customer_dni')) delete orderInsertData.customer_dni;
      if (orderError.message?.includes('voucher_url')) delete orderInsertData.voucher_url;
      if (orderError.message?.includes('payment_method')) delete orderInsertData.payment_method;

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

    // 4b. Deducir stock de los productos
    for (const item of payload.items) {
      const prod = productsMap.get(item.productId);
      if (prod && prod.stock !== null && prod.stock !== undefined) {
        const newStock = Math.max(0, (prod.stock as number) - item.quantity);
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.productId);
      }
    }

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
  } catch (err: any) {
    console.error('Error in createOrder:', err);
    throw err;
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

// ==============================================================================
// STORE BILLING (Métodos de cobro del negocio)
// ==============================================================================

export async function getStoreBilling(storeId: string): Promise<StoreBillingInfo> {
  const empty: StoreBillingInfo = { bank_accounts: [], digital_wallets: [] };
  try {
    const { data, error } = await supabase
      .from('store_billing')
      .select('data')
      .eq('store_id', storeId)
      .maybeSingle();

    if (!error && data?.data) {
      const res = data.data as StoreBillingInfo;
      if ((res.bank_accounts && res.bank_accounts.length > 0) || (res.digital_wallets && res.digital_wallets.length > 0)) {
        return res;
      }
    }

    // Fallback localStorage si no hay en BD o la tabla aún no fue creada
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`klik_store_billing_${storeId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.digital_wallets?.length || parsed.bank_accounts?.length)) {
            return parsed as StoreBillingInfo;
          }
        } catch (e) {}
      }

      // Check latest fallback
      const latest = localStorage.getItem('klik_store_billing_latest');
      if (latest) {
        try {
          const parsed = JSON.parse(latest);
          if (parsed && (parsed.digital_wallets?.length || parsed.bank_accounts?.length)) {
            return parsed as StoreBillingInfo;
          }
        } catch (e) {}
      }
    }

    return (data?.data as StoreBillingInfo) || empty;
  } catch (err) {
    console.error('Error fetching store billing:', err);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`klik_store_billing_${storeId}`) || localStorage.getItem('klik_store_billing_latest');
      if (stored) {
        try {
          return JSON.parse(stored) as StoreBillingInfo;
        } catch (e) {}
      }
    }
    return empty;
  }
}

export async function updateStoreBilling(
  storeId: string,
  billing: StoreBillingInfo
): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`klik_store_billing_${storeId}`, JSON.stringify(billing));
      localStorage.setItem('klik_store_billing_latest', JSON.stringify(billing));
    }

    const { error } = await supabase
      .from('store_billing')
      .upsert({
        store_id: storeId,
        data: billing,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn('Notice: store_billing table pending migration, saved to localStorage fallback:', error.message);
    }
    return true;
  } catch (err) {
    console.error('Error updating store billing:', err);
    return true;
  }
}

// ==============================================================================
// DASHBOARD ANALYTICS — Stock, Top sellers y gráfico de ventas
// ==============================================================================

export async function getLowStockProducts(
  storeId: string,
  threshold: number = 5
): Promise<LowStockProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url, stock')
      .eq('store_id', storeId)
      .eq('active', true)
      .not('stock', 'is', null)
      .lte('stock', threshold)
      .order('stock', { ascending: true })
      .limit(10);
    if (error || !data) return [];
    return data as LowStockProduct[];
  } catch (err) {
    console.error('Error fetching low stock products:', err);
    return [];
  }
}

export async function getTopSellingProducts(
  storeId: string,
  limit: number = 5
): Promise<TopProduct[]> {
  try {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, subtotal')
      .not('product_id', 'is', null);

    if (error || !items) return [];

    // Filter by store orders
    const { data: storeOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', storeId)
      .neq('status', 'cancelled');

    const orderIds = new Set((storeOrders || []).map((o: any) => o.id));

    // Aggregate by product
    const map = new Map<string, { product_name: string; units_sold: number; revenue: number }>();
    for (const item of items) {
      if (!orderIds.has((item as any).order_id)) continue;
      const pid = (item as any).product_id as string;
      const existing = map.get(pid);
      if (existing) {
        existing.units_sold += (item as any).quantity;
        existing.revenue += Number((item as any).subtotal);
      } else {
        map.set(pid, {
          product_name: (item as any).product_name,
          units_sold: (item as any).quantity,
          revenue: Number((item as any).subtotal),
        });
      }
    }

    // Get product images
    const topIds = Array.from(map.entries())
      .sort((a, b) => b[1].units_sold - a[1].units_sold)
      .slice(0, limit)
      .map(([id]) => id);

    const { data: products } = await supabase
      .from('products')
      .select('id, image_url')
      .in('id', topIds);

    const imgMap = new Map((products || []).map((p: any) => [p.id, p.image_url]));

    return topIds.map((pid) => ({
      product_id: pid,
      product_name: map.get(pid)!.product_name,
      image_url: imgMap.get(pid) || null,
      units_sold: map.get(pid)!.units_sold,
      revenue: map.get(pid)!.revenue,
    }));
  } catch (err) {
    console.error('Error fetching top selling products:', err);
    return [];
  }
}

export async function getSalesChart(
  storeId: string,
  period: 'week' | 'month' | 'year'
): Promise<SalesDataPoint[]> {
  try {
    const now = new Date();
    let from: Date;

    const buckets = new Map<string, { label: string; fullDate: string; total: number; count: number }>();

    if (period === 'week') {
      from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const rawWeekday = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
        const label = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1).replace('.', '');
        const fullDate = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        buckets.set(key, { label, fullDate, total: 0, count: 0 });
      }
    } else if (period === 'month') {
      from = new Date(now);
      from.setDate(now.getDate() - 29);
      from.setHours(0, 0, 0, 0);

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const rawMonth = d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '');
        const label = `${d.getDate()} ${rawMonth}`;
        const fullDate = d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
        buckets.set(key, { label, fullDate, total: 0, count: 0 });
      }
    } else {
      from = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const rawMonth = d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '');
        const label = `${rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)} ${d.getFullYear().toString().slice(-2)}`;
        const fullDate = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
        buckets.set(key, { label, fullDate, total: 0, count: 0 });
      }
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('store_id', storeId)
      .neq('status', 'cancelled')
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: true });

    if (!error && orders) {
      for (const order of orders) {
        const d = new Date(order.created_at);
        const key =
          period === 'year'
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const existing = buckets.get(key);
        if (existing) {
          existing.total += Number(order.total) || 0;
          existing.count += 1;
        }
      }
    }

    return Array.from(buckets.values()).map((b) => ({
      label: b.label,
      fullDate: b.fullDate,
      total: Math.round(b.total * 100) / 100,
      count: b.count,
    }));
  } catch (err) {
    console.error('Error fetching sales chart:', err);
    return [];
  }
}

