"use client";

import { useEffect, useState } from "react";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/app/actions-expenses";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { Expense, ExpenseInput } from "@/type";
import { EXPENSE_CATEGORIES } from "@/type";
import {
  Edit,
  Plus,
  Receipt,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseInput>({
    title: "",
    amount: 0,
    category: "Matériel & Équipement",
    expenseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
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
    setEditingExpense(null);
    setForm({
      title: "",
      amount: 0,
      category: "Matériel & Équipement",
      expenseDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (e: Expense) => {
    setEditingExpense(e);
    setForm({
      title: e.title,
      amount: e.amount,
      category: e.category,
      expenseDate: new Date(e.expenseDate).toISOString().split("T")[0],
      notes: e.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.amount <= 0) {
      alert("Veuillez renseigner un titre et un montant valide.");
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, form);
      } else {
        await createExpense(form);
      }
      setModalOpen(false);
      await fetchList();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la dépense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer la dépense "${title}" ?`)) return;
    try {
      await deleteExpense(id);
      await fetchList();
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer cette dépense.");
    }
  };

  const totalFiltered = expenses
    .filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesCat =
        categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    })
    .reduce((acc, e) => acc + e.amount, 0);

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCat =
      categoryFilter === "all" || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Suivi des Dépenses
            </h1>
            <p className="text-sm text-base-content/70">
              Gérez vos achats, charges opérationnelles et suivez votre rentabilité réelle.
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-error text-white btn-sm sm:btn-md gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle dépense
          </button>
        </div>

        {/* KPI Dépenses */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between text-base-content/60">
              <span className="text-xs font-semibold uppercase">Total Dépenses</span>
              <TrendingDown className="h-5 w-5 text-error" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-error">
              {formatMoney(totalFiltered, "XOF")}
            </div>
            <p className="mt-1 text-xs text-base-content/50">
              {filtered.length} dépense(s) comptabilisée(s)
            </p>
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm sm:input-md w-full pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select select-bordered select-sm sm:select-md"
            >
              <option value="all">Toutes les catégories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des dépenses */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-info" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
              <Receipt className="h-7 w-7 text-base-content/50" />
            </div>
            <h3 className="text-lg font-bold">Aucune dépense enregistrée</h3>
            <p className="mt-1 text-sm text-base-content/60">
              {search || categoryFilter !== "all"
                ? "Aucune dépense ne correspond aux filtres appliqués."
                : "Ajoutez vos frais, abonnements et achats pour calculer automatiquement votre bénéfice net."}
            </p>
            <button
              onClick={openCreateModal}
              className="btn btn-error text-white btn-sm mt-5"
            >
              <Plus className="h-4 w-4" />
              Ajouter une dépense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            <table className="table w-full">
              <thead className="bg-base-200/50 text-xs uppercase text-base-content/70">
                <tr>
                  <th>Date</th>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Notes</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-base-200/30">
                    <td className="whitespace-nowrap font-medium text-base-content/70">
                      {new Date(expense.expenseDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="font-semibold text-slate-900">
                      {expense.title}
                    </td>
                    <td>
                      <span className="badge badge-sm badge-ghost gap-1">
                        <Tag className="h-3 w-3" />
                        {expense.category}
                      </span>
                    </td>
                    <td className="text-xs text-base-content/60 max-w-xs truncate">
                      {expense.notes || "—"}
                    </td>
                    <td className="whitespace-nowrap text-right font-bold text-error">
                      - {formatMoney(expense.amount, "XOF")}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="btn btn-ghost btn-circle btn-xs"
                          title="Modifier"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id, expense.title)}
                          className="btn btn-ghost btn-circle btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Création / Modification */}
        {modalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-lg">
              <div className="flex items-center justify-between pb-3 border-b border-base-300">
                <h3 className="font-bold text-lg">
                  {editingExpense ? "Modifier la dépense" : "Enregistrer une dépense"}
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
                    <span className="label-text font-semibold">Description / Titre *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Abonnement Vercel & Supabase, Achat matériel..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Montant (XOF) *</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={form.amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          amount:
                            e.target.value === "" ? 0 : parseFloat(e.target.value),
                        })
                      }
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Date de dépense</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={
                        typeof form.expenseDate === "string"
                          ? form.expenseDate
                          : new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setForm({ ...form, expenseDate: e.target.value })
                      }
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Catégorie</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="select select-bordered w-full"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Notes / Justificatif</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Détails supplémentaires ou référence de facture fournisseur..."
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                    disabled={saving || form.amount <= 0 || !form.title.trim()}
                    className="btn btn-error text-white"
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : editingExpense ? (
                      "Mettre à jour"
                    ) : (
                      "Enregistrer la dépense"
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}
