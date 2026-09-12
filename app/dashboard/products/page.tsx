'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/modules/dashboard.module.scss';
import {
  getCurrentStore,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createStore,
  getAllProductImages,
} from '@/lib/supabase/db';
import { Product, Store } from '@/lib/supabase/types';
import { formatCurrency, slugify } from '@/lib/utils';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Camera,
} from 'lucide-react';

export default function ProductsDashboardPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const s = await getCurrentStore();
    setStore(s);
    if (s) {
      const prods = await getProducts(s.id);
      setProducts(prods);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setErrorMessage(null);
    setName('');
    setPrice('');
    setCategory('General');
    setBrand('');
    setDescription('');
    setImages([]);
    setHasVariants(false);
    setSizes('');
    setColors('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setErrorMessage(null);
    setName(prod.name);
    setPrice(prod.price.toString());
    setCategory(prod.category);
    setBrand(prod.brand || '');
    setDescription(prod.description || '');
    setImages(getAllProductImages(prod));

    if (prod.variants && prod.variants.length > 0) {
      setHasVariants(true);
      const sizeList = prod.variants.filter((v) => v.name === 'Talla').map((v) => v.value);
      const colorList = prod.variants.filter((v) => v.name === 'Color').map((v) => v.value);
      setSizes(sizeList.join(', '));
      setColors(colorList.join(', '));
    } else {
      setHasVariants(false);
      setSizes('');
      setColors('');
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateProduct(id, { active: !currentActive });
    await loadProducts();
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (confirm(`¿Seguro que deseas eliminar "${prodName}"?`)) {
      await deleteProduct(id);
      await loadProducts();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, ingresa el nombre del producto.');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setErrorMessage('Por favor, ingresa un precio válido mayor a 0.');
      return;
    }

    setIsSaving(true);
    try {
      let targetStore = store;
      if (!targetStore) {
        // Inicializar tienda automáticamente si el usuario ingresó directo a productos
        targetStore = await createStore({
          name: 'Mi Tienda',
          slug: 'mi-tienda-' + Date.now(),
          whatsapp: '+51999888777',
        });
        if (targetStore) {
          setStore(targetStore);
        } else {
          throw new Error('No se pudo inicializar la tienda.');
        }
      }

      const variants: Array<{ name: string; value: string }> = [];
      if (hasVariants) {
        if (sizes.trim()) {
          sizes.split(',').forEach((s) => {
            if (s.trim()) variants.push({ name: 'Talla', value: s.trim() });
          });
        }
        if (colors.trim()) {
          colors.split(',').forEach((c) => {
            if (c.trim()) variants.push({ name: 'Color', value: c.trim() });
          });
        }
      }

      const mainImageUrl = images[0] || null;
      const additionalImages = images.slice(1);

      if (editingProduct) {
        const updated = await updateProduct(
          editingProduct.id,
          {
            name: name.trim(),
            price: parseFloat(price) || 0,
            category: category.trim() || 'General',
            brand: brand.trim() || null,
            description: description.trim(),
            image_url: mainImageUrl,
          },
          variants,
          additionalImages
        );
        if (!updated) throw new Error('Error al actualizar el producto.');
      } else {
        const created = await createProduct(
          {
            store_id: targetStore.id,
            name: name.trim(),
            slug: slugify(name.trim()),
            price: parseFloat(price) || 0,
            category: category.trim() || 'General',
            brand: brand.trim() || null,
            description: description.trim(),
            image_url: mainImageUrl,
            active: true,
          },
          variants,
          additionalImages
        );
        if (!created) throw new Error('Error al registrar el producto.');
      }

      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMessage(err?.message || 'Error al conectar con la base de datos');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Catálogo de Productos
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Gestiona los productos disponibles en tu tienda online.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn--primary btn--sm">
          <Plus size={16} /> Agregar producto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Package size={48} />
          </div>
          <div className="empty-state__title">Todavía no tienes productos</div>
          <div className="empty-state__description">
            Agrega tu primer artículo para que los clientes puedan verlo y comprar desde tu tienda.
          </div>
          <button onClick={handleOpenCreate} className="btn btn--primary btn--sm">
            <Plus size={16} /> Agregar primer producto
          </button>
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Foto</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Variantes</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id} style={{ opacity: prod.active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                        <img
                          src={
                            prod.image_url ||
                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&fit=crop'
                          }
                          alt={prod.name}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '1px solid var(--color-hairline)',
                          }}
                        />
                        {prod.images && prod.images.length > 0 && (
                          <span
                            title={`${prod.images.length + 1} fotos (carrusel habilitado)`}
                            style={{
                              position: 'absolute',
                              bottom: '-4px',
                              right: '-4px',
                              backgroundColor: 'var(--color-ink)',
                              color: '#FFFFFF',
                              fontSize: '9px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              padding: '1px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <Camera size={8} />+{prod.images.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                        {prod.brand && (
                          <>
                            <span style={{ fontWeight: 600, color: 'var(--color-ink)', backgroundColor: 'var(--color-canvas)', padding: '0.1rem 0.35rem', borderRadius: '6px' }}>
                              {prod.brand}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>qori.business/.../{prod.slug}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge--soft">
                        {prod.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{formatCurrency(prod.price)}</td>
                    <td>
                      {prod.variants && prod.variants.length > 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>
                          {prod.variants.length} variante(s)
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>Estándar</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(prod.id, prod.active)}
                        className={`btn btn--sm ${prod.active ? 'btn--secondary' : 'btn--ghost'}`}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        title={prod.active ? 'Desactivar producto' : 'Activar producto'}
                      >
                        {prod.active ? (
                          <>
                            <Eye size={13} /> Activo
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} /> Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="btn btn--secondary btn--sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Editar producto"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="btn btn--danger btn--sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Eliminar producto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL (Section 16) */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 10, 10, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-paper)',
              borderRadius: '24px',
              border: '1px solid var(--color-hairline)',
              boxShadow: 'var(--shadow-subtle)',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-mid-gray)' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.75rem 1rem',
                  borderRadius: '18px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label>Nombre del producto *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Polo Oversize Algodón Pima"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Precio (S/) *</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input"
                    placeholder="69.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Polos, Joyas"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Nike, Qori, Artesanal"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
              </div>

              <MultiImageUpload
                label="Fotos del Producto"
                images={images}
                onChange={setImages}
                maxImages={6}
                folder="products"
                helperText="Sube hasta 6 fotos. La primera será la portada. Con 2 o más fotos se creará automáticamente un carrusel interactivo."
              />

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  className="textarea"
                  placeholder="Detalles sobre tela, calce, colores o cuidados..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Variantes */}
              <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    id="hasVariantsModal"
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="hasVariantsModal" style={{ fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
                    Tiene variantes (tallas, colores, etc.)
                  </label>
                </div>

                {hasVariants && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Tallas (coma separadas)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="S, M, L"
                        value={sizes}
                        onChange={(e) => setSizes(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Colores (coma separados)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Negro, Blanco, Arena"
                        value={colors}
                        onChange={(e) => setColors(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary" disabled={isSaving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="spin" /> Guardando producto...
                    </>
                  ) : editingProduct ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
