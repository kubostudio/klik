"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/modules/dashboard.module.scss";
import {
  getCurrentStore,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createStore,
  getAllProductImages,
  updateStore,
  updateProductsOrder,
} from "@/lib/supabase/db";
import { useDashboard } from "@/contexts/DashboardContext";
import { Product, Store, ProductSortMode } from "@/lib/supabase/types";
import { formatCurrency, slugify } from "@/lib/utils";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
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
  Link2,
  Sparkles,
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function ProductsDashboardPage() {
  const { store: contextStore } = useDashboard();
  const [store, setStore] = useState<Store | null>(contextStore);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [stock, setStock] = useState<string>(""); // empty = no stock control
  const [showStock, setShowStock] = useState<boolean>(true); // show stock in public store
  const [showPrice, setShowPrice] = useState<boolean>(true); // show price in public store

  // URL Import State
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Sorting & Drag-and-Drop State
  const [sortMode, setSortMode] = useState<ProductSortMode>("custom");
  const [isUpdatingSort, setIsUpdatingSort] = useState(false);
  const [sortNotification, setSortNotification] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, [contextStore?.id]);

  const showSortFeedback = (msg: string) => {
    setSortNotification(msg);
    setTimeout(() => {
      setSortNotification(null);
    }, 3200);
  };

  const loadProducts = async () => {
    setLoading(true);
    const s = contextStore || (await getCurrentStore());
    setStore(s);
    if (s) {
      const mode = s.product_sort_mode || "custom";
      setSortMode(mode);
      const prods = await getProducts(s.id, false, mode);
      setProducts(prods);
    }
    setLoading(false);
  };

  const handleSortModeChange = async (newMode: ProductSortMode) => {
    if (!store) return;
    setSortMode(newMode);

    let sorted = [...products];
    if (newMode === "name_asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    } else if (newMode === "name_desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name, "es", { sensitivity: "base" }));
    } else if (newMode === "price_asc") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (newMode === "price_desc") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    }
    setProducts(sorted);

    try {
      setIsUpdatingSort(true);
      await updateStore(store.id, { product_sort_mode: newMode });
      setStore((prev) => (prev ? { ...prev, product_sort_mode: newMode } : prev));

      const labels: Record<ProductSortMode, string> = {
        name_asc: "Alfabético (A → Z)",
        name_desc: "Alfabético (Z → A)",
        price_asc: "Precio (Menor a Mayor)",
        price_desc: "Precio (Mayor a Menor)",
        custom: "Orden Personalizado (por arrastre)",
      };
      showSortFeedback(`Orden público actualizado: ${labels[newMode]}`);
    } catch (err) {
      console.error("Error updating store sort mode:", err);
    } finally {
      setIsUpdatingSort(false);
    }
  };

  // Drag-and-drop row handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !store) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...products];
    const [movedProduct] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedProduct);

    setProducts(reordered);
    setSortMode("custom");
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      setIsUpdatingSort(true);
      const orderedIds = reordered.map((p) => p.id);
      await updateProductsOrder(store.id, orderedIds);
      await updateStore(store.id, { product_sort_mode: "custom" });
      setStore((prev) => (prev ? { ...prev, product_sort_mode: "custom" } : prev));
      showSortFeedback("¡Orden personalizado guardado para la tienda pública!");
    } catch (err) {
      console.error("Error saving product drag order:", err);
    } finally {
      setIsUpdatingSort(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getSortBtnStyle = (mode: ProductSortMode) => {
    const isActive = sortMode === mode;
    return {
      padding: "0.35rem 0.75rem",
      fontSize: "0.75rem",
      fontWeight: isActive ? 600 : 500,
      borderRadius: "8px",
      border: "none",
      backgroundColor: isActive ? "var(--color-primary)" : "transparent",
      color: isActive ? "#FFFFFF" : "var(--color-ink)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      transition: "all 0.15s ease",
    };
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setErrorMessage(null);
    setImportUrl("");
    setIsImporting(false);
    setImportSuccess(null);
    setImportError(null);
    setName("");
    setPrice("");
    setCategory("General");
    setBrand("");
    setDescription("");
    setImages([]);
    setHasVariants(false);
    setSizes("");
    setColors("");
    setStock("");
    setShowStock(true);
    setShowPrice(true);
    setIsModalOpen(true);
  };

  const handleImportFromUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importUrl.trim()) {
      setImportError("Por favor ingresa la URL de la página del producto.");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const res = await fetch("/api/products/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo extraer la información del producto.");
      }

      const { data } = json;

      if (data.name) setName(data.name);
      if (data.price) setPrice(data.price);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.brand) setBrand(data.brand);
      if (Array.isArray(data.images) && data.images.length > 0) {
        setImages(data.images);
      }

      setImportSuccess(
        `¡Producto "${data.name || "importado"}" extraído con éxito! Revisa o ajusta los datos abajo.`
      );
    } catch (err: any) {
      setImportError(err.message || "Error al importar el producto desde la URL.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setErrorMessage(null);
    setName(prod.name);
    setPrice(prod.price.toString());
    setCategory(prod.category);
    setBrand(prod.brand || "");
    setDescription(prod.description || "");
    setImages(getAllProductImages(prod));

    if (prod.variants && prod.variants.length > 0) {
      setHasVariants(true);
      const sizeList = prod.variants
        .filter((v) => v.name === "Talla")
        .map((v) => v.value);
      const colorList = prod.variants
        .filter((v) => v.name === "Color")
        .map((v) => v.value);
      setSizes(sizeList.join(", "));
      setColors(colorList.join(", "));
    } else {
      setHasVariants(false);
      setSizes("");
      setColors("");
    }
    setStock(prod.stock !== null && prod.stock !== undefined ? prod.stock.toString() : "");
    setShowStock(prod.show_stock !== false);
    setShowPrice(prod.show_price !== false);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateProduct(id, { active: !currentActive });
    await loadProducts();
  };

  const handleToggleShowStock = async (prod: Product) => {
    const nextVal = prod.show_stock === false ? true : false;
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, show_stock: nextVal } : p))
    );
    await updateProduct(prod.id, { show_stock: nextVal });
  };

  const handleToggleShowPrice = async (prod: Product) => {
    const nextVal = prod.show_price === false ? true : false;
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, show_price: nextVal } : p))
    );
    await updateProduct(prod.id, { show_price: nextVal });
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
      setErrorMessage("Por favor, ingresa el nombre del producto.");
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setErrorMessage("Por favor, ingresa un precio válido mayor a 0.");
      return;
    }

    setIsSaving(true);
    try {
      let targetStore = store;
      if (!targetStore) {
        // Inicializar tienda automáticamente si el usuario ingresó directo a productos
        targetStore = await createStore({
          name: "Mi Tienda",
          slug: "mi-tienda-" + Date.now(),
          whatsapp: "+51999888777",
        });
        if (targetStore) {
          setStore(targetStore);
        } else {
          throw new Error("No se pudo inicializar la tienda.");
        }
      }

      const variants: Array<{ name: string; value: string }> = [];
      if (hasVariants) {
        if (sizes.trim()) {
          sizes.split(",").forEach((s) => {
            if (s.trim()) variants.push({ name: "Talla", value: s.trim() });
          });
        }
        if (colors.trim()) {
          colors.split(",").forEach((c) => {
            if (c.trim()) variants.push({ name: "Color", value: c.trim() });
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
            category: category.trim() || "General",
            brand: brand.trim() || null,
            description: description.trim(),
            image_url: mainImageUrl,
            stock: stock.trim() !== "" ? parseInt(stock, 10) : null,
            show_stock: showStock,
            show_price: showPrice,
          },
          variants,
          additionalImages,
        );
        if (!updated) throw new Error("Error al actualizar el producto.");
      } else {
        const created = await createProduct(
          {
            store_id: targetStore.id,
            name: name.trim(),
            slug: slugify(name.trim()),
            price: parseFloat(price) || 0,
            category: category.trim() || "General",
            brand: brand.trim() || null,
            description: description.trim(),
            image_url: mainImageUrl,
            active: true,
            stock: stock.trim() !== "" ? parseInt(stock, 10) : null,
            show_stock: showStock,
            show_price: showPrice,
          },
          variants,
          additionalImages,
        );
        if (!created) throw new Error("Error al registrar el producto.");
      }

      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      console.error("Error saving product:", err);
      setErrorMessage(err?.message || "Error al conectar con la base de datos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
            }}
          >
            Catálogo de Productos
          </h1>
          <p
            style={{
              color: "var(--color-mid-gray)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
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
            Agrega tu primer artículo para que los clientes puedan verlo y
            comprar desde tu tienda.
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn btn--primary btn--sm"
          >
            <Plus size={16} /> Agregar primer producto
          </button>
        </div>
      ) : (
        <div className={styles.panel} style={{ overflow: "hidden" }}>
          {/* BARRA DE ORDENACIÓN EN TIENDA PÚBLICA */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "0.875rem 1.25rem",
              backgroundColor: "var(--color-surface-alt)",
              borderBottom: "1px solid var(--color-hairline)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-mid-gray)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <ArrowUpDown size={14} /> Orden en tienda pública:
              </span>
              <div
                style={{
                  display: "inline-flex",
                  backgroundColor: "var(--color-paper)",
                  padding: "3px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-hairline)",
                  gap: "2px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSortModeChange("name_asc")}
                  style={getSortBtnStyle("name_asc")}
                  title="Ordenar alfabéticamente de la A a la Z"
                >
                  A → Z
                </button>
                <button
                  type="button"
                  onClick={() => handleSortModeChange("name_desc")}
                  style={getSortBtnStyle("name_desc")}
                  title="Ordenar alfabéticamente de la Z a la A"
                >
                  Z → A
                </button>
                <button
                  type="button"
                  onClick={() => handleSortModeChange("price_asc")}
                  style={getSortBtnStyle("price_asc")}
                  title="Ordenar precio de menor a mayor"
                >
                  Precio ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleSortModeChange("price_desc")}
                  style={getSortBtnStyle("price_desc")}
                  title="Ordenar precio de mayor a menor"
                >
                  Precio ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleSortModeChange("custom")}
                  style={getSortBtnStyle("custom")}
                  title="Personalizado: arrastra las filas de la tabla para fijar el orden exacto"
                >
                  <GripVertical size={13} /> Personalizado (arrastre)
                </button>
              </div>
            </div>

            {sortNotification && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#16a34a",
                  backgroundColor: "rgba(34,197,94,0.1)",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontWeight: 600,
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <Check size={13} /> {sortNotification}
              </div>
            )}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{ width: "48px", textAlign: "center" }}
                    title="Arrastra las filas para definir el orden personalizado"
                  >
                    <span style={{ fontSize: "11px", color: "var(--color-mid-gray)" }}>#</span>
                  </th>
                  <th style={{ width: "60px" }}>Foto</th>
                  <th
                    onClick={() => handleSortModeChange(sortMode === "name_asc" ? "name_desc" : "name_asc")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Clic para alternar orden alfabético A-Z / Z-A"
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <span>Nombre</span>
                      {sortMode === "name_asc" ? (
                        <ArrowUp size={13} style={{ color: "var(--color-primary)" }} />
                      ) : sortMode === "name_desc" ? (
                        <ArrowDown size={13} style={{ color: "var(--color-primary)" }} />
                      ) : (
                        <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                      )}
                    </div>
                  </th>
                  <th>Categoría</th>
                  <th
                    onClick={() => handleSortModeChange(sortMode === "price_asc" ? "price_desc" : "price_asc")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Clic para alternar orden por precio"
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <span>Precio</span>
                      {sortMode === "price_asc" ? (
                        <ArrowUp size={13} style={{ color: "var(--color-primary)" }} />
                      ) : sortMode === "price_desc" ? (
                        <ArrowDown size={13} style={{ color: "var(--color-primary)" }} />
                      ) : (
                        <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                      )}
                    </div>
                  </th>
                  <th>Stock</th>
                  <th>Variantes</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod, index) => {
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <tr
                      key={prod.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        opacity: isDragging ? 0.35 : prod.active ? 1 : 0.6,
                        backgroundColor: isDragOver ? "rgba(217, 119, 66, 0.08)" : undefined,
                        borderTop: isDragOver ? "2px solid var(--color-primary)" : undefined,
                        cursor: "grab",
                        transition: "background-color 0.15s ease, opacity 0.15s ease",
                      }}
                      title="Arrastra para reordenar en la tienda pública"
                    >
                      <td
                        style={{
                          textAlign: "center",
                          width: "48px",
                          color: "var(--color-mid-gray)",
                          padding: "10px 4px",
                          userSelect: "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "2px",
                          }}
                        >
                          <GripVertical size={15} style={{ color: "var(--color-mid-gray)", cursor: "grab" }} />
                          <span style={{ fontSize: "11px", fontWeight: 600, minWidth: "14px" }}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            position: "relative",
                            width: "44px",
                            height: "44px",
                          }}
                        >
                          <img
                            src={
                              prod.image_url ||
                              "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&fit=crop"
                            }
                            alt={prod.name}
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: "1px solid var(--color-hairline)",
                            }}
                          />
                          {prod.images && prod.images.length > 0 && (
                            <span
                              title={`${prod.images.length + 1} fotos (carrusel habilitado)`}
                              style={{
                                position: "absolute",
                                bottom: "-4px",
                                right: "-4px",
                                backgroundColor: "var(--color-ink)",
                                color: "#FFFFFF",
                                fontSize: "9px",
                                fontWeight: 600,
                                borderRadius: "6px",
                                padding: "1px 4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                            >
                              <Camera size={8} />+{prod.images.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{ fontWeight: 600, color: "var(--color-ink)" }}
                        >
                          {prod.name}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--soft" style={{ textAlign: "center" }}>{prod.category}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                          {formatCurrency(prod.price)}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleShowPrice(prod);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.7rem",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            padding: "0.1rem 0",
                            color: prod.show_price === false ? "#ef4444" : "#16a34a",
                            fontWeight: 500,
                          }}
                          title={prod.show_price === false ? "Precio oculto en tienda pública (clic para mostrar)" : "Precio visible en tienda pública (clic para ocultar)"}
                        >
                          {prod.show_price === false ? (
                            <>
                              <EyeOff size={11} /> Oculto en tienda
                            </>
                          ) : (
                            <>
                              <Eye size={11} /> Visible
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <div>
                          {prod.stock === null || prod.stock === undefined ? (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-mid-gray)" }}>—</span>
                          ) : prod.stock === 0 ? (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", padding: "0.2rem 0.5rem", borderRadius: "8px" }}>Agotado</span>
                          ) : prod.stock <= 5 ? (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ca8a04", backgroundColor: "rgba(234,179,8,0.1)", padding: "0.2rem 0.5rem", borderRadius: "8px" }}>{prod.stock} uds.</span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", backgroundColor: "rgba(34,197,94,0.1)", padding: "0.2rem 0.5rem", borderRadius: "8px" }}>{prod.stock} uds.</span>
                          )}
                        </div>
                        {prod.stock !== null && prod.stock !== undefined && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleShowStock(prod);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.7rem",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              padding: "0.1rem 0",
                              marginTop: "0.2rem",
                              color: prod.show_stock === false ? "#ef4444" : "#16a34a",
                              fontWeight: 500,
                            }}
                            title={prod.show_stock === false ? "Cantidad de stock oculta en tienda (clic para mostrar)" : "Cantidad de stock visible en tienda (clic para ocultar)"}
                          >
                            {prod.show_stock === false ? (
                              <>
                                <EyeOff size={11} /> Cant. oculta
                              </>
                            ) : (
                              <>
                                <Eye size={11} /> Cant. visible
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      <td>
                        {prod.variants && prod.variants.length > 0 ? (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-mid-gray)",
                            }}
                          >
                            {prod.variants.length} variante(s)
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-mid-gray)",
                            }}
                          >
                            Estándar
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(prod.id, prod.active)}
                          className={`btn btn--sm ${prod.active ? "btn--secondary" : "btn--ghost"}`}
                          style={{
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.75rem",
                          }}
                          title={
                            prod.active
                              ? "Desactivar producto"
                              : "Activar producto"
                          }
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
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="btn btn--secondary btn--sm"
                            style={{ padding: "0.35rem 0.5rem" }}
                            title="Editar producto"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="btn btn--danger btn--sm"
                            style={{ padding: "0.35rem 0.5rem" }}
                            title="Eliminar producto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL (Section 16) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 10, 10, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-paper)",
              borderRadius: "24px",
              border: "1px solid var(--color-hairline)",
              boxShadow: "var(--shadow-subtle)",
              maxWidth: "540px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-ink)",
                }}
              >
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-mid-gray)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid rgba(185, 28, 28, 0.25)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              {/* Sección de Importación desde Enlace Web (Solo en modo Nuevo Producto) */}
              {!editingProduct && (
                <div
                  style={{
                    backgroundColor: "var(--color-surface-alt, #faf5f0)",
                    border: "1px solid var(--color-hairline, rgba(35, 20, 10, 0.08))",
                    borderRadius: "12px",
                    padding: "16px 18px",
                    marginBottom: "1.25rem",
                    boxShadow: "0 1px 3px rgba(35, 20, 10, 0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(217, 119, 66, 0.12)",
                        color: "#d97742",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={15} />
                    </div>
                    <h3
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-ink, #232323)",
                        margin: 0,
                      }}
                    >
                      Importar producto con link
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-mid-gray, #737373)",
                      margin: "0 0 10px 0",
                      lineHeight: 1.45,
                    }}
                  >
                    Pega el enlace de cualquier tienda o página web para autocompletar nombre, precio, descripción y fotos al instante.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <div style={{ position: "relative", flex: 1 }}>
                      <input
                        type="url"
                        className="input"
                        placeholder="https://tienda.com/producto/..."
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        disabled={isImporting}
                        style={{
                          height: "40px",
                          fontSize: "0.8125rem",
                          paddingLeft: "34px",
                          backgroundColor: "var(--color-paper, #ffffff)",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImportFromUrl();
                          }
                        }}
                      />
                      <Link2
                        size={15}
                        style={{
                          position: "absolute",
                          left: "11px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--color-mid-gray, #737373)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleImportFromUrl}
                      disabled={isImporting || !importUrl.trim()}
                      className="btn btn--secondary"
                      style={{
                        height: "40px",
                        padding: "0 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        whiteSpace: "nowrap",
                        borderRadius: "8px",
                      }}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 size={15} className="spinner" />
                          <span>Importando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Importar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {importSuccess && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        backgroundColor: "#f0faf4",
                        border: "1px solid rgba(22, 101, 52, 0.2)",
                        color: "#166534",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginTop: "10px",
                        fontSize: "0.75rem",
                        lineHeight: 1.4,
                      }}
                    >
                      <Check size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>{importSuccess}</span>
                    </div>
                  )}

                  {importError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid rgba(185, 28, 28, 0.2)",
                        color: "#b91c1c",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginTop: "10px",
                        fontSize: "0.75rem",
                        lineHeight: 1.4,
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              )}

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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.75rem",
                }}
              >
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
                    placeholder="Ej. Nike, Klik, Artesanal"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Stock disponible</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Ej. 50 (dejar vacío = sin control de stock)"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                  <span className="helper-text">Si el stock llega a 0, el producto se ocultará automáticamente de tu tienda pública.</span>
                </div>
              </div>

              {/* Controles de Visibilidad Pública */}
              <div
                style={{
                  backgroundColor: "var(--color-canvas)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-ink)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Eye size={15} color="var(--color-primary)" />
                  Privacidad y Visibilidad en la Tienda Pública
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showStock}
                    onChange={(e) => setShowStock(e.target.checked)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                  />
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-ink)" }}>
                      Mostrar cantidad de stock a los clientes
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-mid-gray)" }}>
                      Si está marcado, los compradores verán &quot;X disponibles&quot;. Si se desmarca, se ocultará el número pero podrán comprar según el inventario real.
                    </p>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                  />
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-ink)" }}>
                      Mostrar precio en la tienda pública
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-mid-gray)" }}>
                      Si está marcado, se mostrará el monto en Soles. Si se desmarca, se ocultará el precio y se mostrará un botón para consultar.
                    </p>
                  </div>
                </label>
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
              <div
                style={{
                  borderTop: "1px solid var(--color-hairline)",
                  paddingTop: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <input
                    id="hasVariantsModal"
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  <label
                    htmlFor="hasVariantsModal"
                    style={{
                      fontWeight: 500,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Tiene variantes (tallas, colores, etc.)
                  </label>
                </div>

                {hasVariants && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem" }}>
                        Tallas (coma separadas)
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="S, M, L"
                        value={sizes}
                        onChange={(e) => setSizes(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem" }}>
                        Colores (coma separados)
                      </label>
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn--secondary"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="spin" /> Guardando
                      producto...
                    </>
                  ) : editingProduct ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Producto"
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
