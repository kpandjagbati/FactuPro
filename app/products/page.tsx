"use client";

import { useEffect, useState } from "react";
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/app/actions-products";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { Product, ProductInput } from "@/type";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Edit,
  Minus,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "tracked">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>({
    name: "",
    description: "",
    unitPrice: 0,
    unit: "unité",
    category: "",
    trackStock: false,
    stockQuantity: 0,
    minStockAlert: 5,
  });
  const [saving, setSaving] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      description: "",
      unitPrice: 0,
      unit: "unité",
      category: "",
      trackStock: false,
      stockQuantity: 0,
      minStockAlert: 5,
    });
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      unitPrice: p.unitPrice,
      unit: p.unit || "unité",
      category: p.category || "",
      trackStock: Boolean(p.trackStock),
      stockQuantity: p.stockQuantity || 0,
      minStockAlert: p.minStockAlert || 5,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form);
      } else {
        await createProduct(form);
      }
      setModalOpen(false);
      await fetchList();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du produit.");
    } finally {
      setSaving(false);
    }
  };

  const handleStockAdjust = async (id: string, delta: number) => {
    setAdjustingId(id);
    try {
      await adjustProductStock(id, delta);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stockQuantity: (p.stockQuantity || 0) + delta } : p,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAdjustingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'article "${name}" ?`)) return;
    try {
      await deleteProduct(id);
      await fetchList();
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer cet article.");
    }
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ) as string[];

  const trackedCount = products.filter((p) => p.trackStock).length;
  const lowStockCount = products.filter(
    (p) => p.trackStock && (p.stockQuantity || 0) <= (p.minStockAlert || 5),
  ).length;

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === "tracked") matchesStock = Boolean(p.trackStock);
    if (stockFilter === "low")
      matchesStock = Boolean(
        p.trackStock && (p.stockQuantity || 0) <= (p.minStockAlert || 5),
      );

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Catalogue d&apos;Articles & Stock
            </h1>
            <p className="text-sm text-base-content/70">
              Gérez votre inventaire, quantités en stock et tarifs pour vos devis et factures.
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-info btn-sm sm:btn-md gap-2">
            <Plus className="h-4 w-4" />
            Nouvel article
          </button>
        </div>

        {/* Cartes KPI Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-base-content/60">
              <span>Articles enregistrés</span>
              <Package className="h-4 w-4 text-info" />
            </div>
            <div className="mt-1 text-2xl font-black">{products.length}</div>
          </div>

          <div
            onClick={() => setStockFilter(stockFilter === "tracked" ? "all" : "tracked")}
            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition ${
              stockFilter === "tracked"
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-base-300 bg-base-100 hover:bg-base-200/50"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-base-content/60">
              <span>Articles suivis en stock</span>
              <Boxes className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-1 text-2xl font-black">{trackedCount}</div>
          </div>

          <div
            onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition ${
              lowStockCount > 0
                ? "border-error/40 bg-error/10 text-error ring-1 ring-error/30"
                : "border-base-300 bg-base-100"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Alertes stock faible</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="mt-1 text-2xl font-black">{lowStockCount}</div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              placeholder="Rechercher un article ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm sm:input-md w-full pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select select-bordered select-sm sm:select-md"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {stockFilter !== "all" && (
              <button
                onClick={() => setStockFilter("all")}
                className="btn btn-sm btn-ghost gap-1 text-xs"
              >
                <X className="h-3.5 w-3.5" />
                Effacer filtre
              </button>
            )}
          </div>
        </div>

        {/* Liste des produits */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-info" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
              <Package className="h-7 w-7 text-base-content/50" />
            </div>
            <h3 className="text-lg font-bold">Aucun article trouvé</h3>
            <p className="mt-1 text-sm text-base-content/60">
              {search || categoryFilter !== "all" || stockFilter !== "all"
                ? "Aucun résultat pour ces critères."
                : "Créez votre premier article ou prestation pour préremplir vos factures en 1 clic."}
            </p>
            <button
              onClick={openCreateModal}
              className="btn btn-info btn-sm mt-5"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => {
              const isTracked = product.trackStock;
              const qty = product.stockQuantity || 0;
              const alertQty = product.minStockAlert || 5;
              const isLow = isTracked && qty <= alertQty && qty > 0;
              const isOut = isTracked && qty <= 0;

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base md:text-lg">{product.name}</h3>
                      {product.category && (
                        <span className="badge badge-sm badge-ghost shrink-0 gap-1">
                          <Tag className="h-3 w-3" />
                          {product.category}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="mt-2 text-xs text-base-content/70 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Badge de stock */}
                    <div className="mt-3 flex items-center gap-2">
                      {isTracked ? (
                        <div className="flex items-center gap-2 w-full justify-between bg-base-200/50 p-2 rounded-lg border border-base-200">
                          <div className="flex items-center gap-1.5 text-xs">
                            {isOut ? (
                              <span className="badge badge-sm badge-error gap-1">
                                <AlertTriangle className="h-3 w-3" /> Rupture
                              </span>
                            ) : isLow ? (
                              <span className="badge badge-sm badge-warning gap-1">
                                <AlertTriangle className="h-3 w-3" /> Stock faible ({qty})
                              </span>
                            ) : (
                              <span className="badge badge-sm badge-success gap-1">
                                <CheckCircle2 className="h-3 w-3" /> En stock ({qty})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={adjustingId === product.id || qty <= 0}
                              onClick={() => handleStockAdjust(product.id, -1)}
                              className="btn btn-xs btn-square btn-ghost border border-base-300"
                              title="Décrémenter (-1)"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={adjustingId === product.id}
                              onClick={() => handleStockAdjust(product.id, 1)}
                              className="btn btn-xs btn-square btn-ghost border border-base-300"
                              title="Incrémenter (+1)"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-base-content/50 italic">
                          Service / Prestation sans suivi de stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-base-200 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-base-content/50">Prix unitaire</span>
                      <div className="font-extrabold text-info text-lg">
                        {formatMoney(product.unitPrice, "XOF")}
                        <span className="text-xs font-normal text-base-content/60 ml-1">
                          / {product.unit || "unité"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="btn btn-ghost btn-circle btn-sm"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="btn btn-ghost btn-circle btn-sm text-error"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Création / Modification */}
        {modalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-lg">
              <div className="flex items-center justify-between pb-3 border-b border-base-300">
                <h3 className="font-bold text-lg">
                  {editingProduct ? "Modifier l'article" : "Nouvel article / prestation"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nom de l&apos;article *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Conception site web, Cartouche d'encre..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Catégorie</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Matériel, Développement, Fournitures..."
                    value={form.category || ""}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Prix unitaire (XOF) *</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={form.unitPrice}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unitPrice: e.target.value === "" ? 0 : parseFloat(e.target.value),
                        })
                      }
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Unité</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: unité, carton, heure, jour, forfait"
                      value={form.unit || "unité"}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                {/* Section Gestion de Stock */}
                <div className="rounded-xl border border-base-300 bg-base-200/50 p-3.5 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-info checkbox-sm"
                      checked={Boolean(form.trackStock)}
                      onChange={(e) =>
                        setForm({ ...form, trackStock: e.target.checked })
                      }
                    />
                    <div className="text-xs">
                      <span className="font-bold block">Activer le suivi d&apos;inventaire / stock</span>
                      <span className="text-base-content/60">
                        Alertes en cas de stock faible et décompte des quantités.
                      </span>
                    </div>
                  </label>

                  {form.trackStock && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-base-300">
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text font-semibold text-xs">
                            Quantité en stock
                          </span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.stockQuantity || 0}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              stockQuantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="input input-bordered input-sm w-full mt-1"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text font-semibold text-xs">
                            Seuil d&apos;alerte mini
                          </span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.minStockAlert || 5}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              minStockAlert: parseInt(e.target.value) || 5,
                            })
                          }
                          className="input input-bordered input-sm w-full mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Description détaillée (optionnelle)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Détail de la prestation ou spécifications de l'article..."
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="textarea textarea-bordered w-full"
                  />
                </div>

                <div className="modal-action">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-ghost"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-info"
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : editingProduct ? (
                      "Mettre à jour"
                    ) : (
                      "Créer l'article"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
