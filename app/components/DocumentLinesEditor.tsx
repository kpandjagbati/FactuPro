"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/app/actions-products";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/type";
import { Package, Plus, Trash } from "lucide-react";

export type EditableLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  title?: string;
  currency: string;
  lines: EditableLine[];
  onChange: (lines: EditableLine[]) => void;
  emptyMessage?: string;
};

export default function DocumentLinesEditor({
  title = "Produits / Services",
  currency,
  lines,
  onChange,
  emptyMessage = "Aucune ligne. Cliquez sur + pour en ajouter.",
}: Props) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  useEffect(() => {
    getProducts()
      .then((items) => setCatalog(items))
      .catch((err) => console.error("Catalog load error:", err));
  }, []);

  const addLine = () => {
    onChange([
      ...lines,
      {
        id: `temp-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleInsertProduct = (productId: string) => {
    if (!productId) return;
    const prod = catalog.find((p) => p.id === productId);
    if (!prod) return;

    onChange([
      ...lines,
      {
        id: `temp-${Date.now()}`,
        description: prod.name + (prod.description ? ` - ${prod.description}` : ""),
        quantity: 1,
        unitPrice: prod.unitPrice,
      },
    ]);
    setSelectedProductId("");
  };

  const updateLine = (index: number, patch: Partial<EditableLine>) => {
    const next = [...lines];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeLine = (index: number) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  return (
    <div className="h-fit w-full rounded-xl bg-base-200 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="badge badge-info">{title}</h2>

        <div className="flex items-center gap-2">
          {catalog.length > 0 && (
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(e) => handleInsertProduct(e.target.value)}
                className="select select-bordered select-xs sm:select-sm text-xs"
              >
                <option value="">+ Insérer du catalogue...</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatMoney(p.unitPrice, currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm btn-info shrink-0"
            onClick={addLine}
            aria-label="Ajouter une ligne"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ligne</span>
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="py-6 text-center text-sm text-base-content/60">
          <p>{emptyMessage}</p>
          {catalog.length > 0 && (
            <p className="mt-2 text-xs text-info flex items-center justify-center gap-1">
              <Package className="h-3.5 w-3.5" />
              Vous avez {catalog.length} article(s) dans votre catalogue prêts à être insérés.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile : cartes */}
          <div className="space-y-3 md:hidden">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-xl border border-base-300 bg-base-100 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-xs font-medium uppercase text-base-content/50">
                    Ligne {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="btn btn-circle btn-ghost btn-xs text-error"
                    aria-label="Supprimer la ligne"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <label className="form-control mb-3 w-full">
                  <span className="label-text mb-1 text-xs">Description</span>
                  <input
                    type="text"
                    value={line.description}
                    className="input input-bordered input-sm w-full"
                    onChange={(e) =>
                      updateLine(index, { description: e.target.value })
                    }
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="form-control w-full">
                    <span className="label-text mb-1 text-xs">Qté</span>
                    <input
                      type="number"
                      value={line.quantity}
                      className="input input-bordered input-sm w-full"
                      min={0}
                      onChange={(e) =>
                        updateLine(index, {
                          quantity:
                            e.target.value === ""
                              ? 0
                              : parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text mb-1 text-xs">Prix unit. HT</span>
                    <input
                      type="number"
                      value={line.unitPrice}
                      className="input input-bordered input-sm w-full"
                      min={0}
                      step={1}
                      onChange={(e) =>
                        updateLine(index, {
                          unitPrice:
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="mt-3 flex justify-between border-t border-base-300 pt-3 text-sm">
                  <span className="text-base-content/60">Montant HT</span>
                  <span className="font-bold">
                    {formatMoney(line.quantity * line.unitPrice, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop : tableau */}
          <div className="scrollable hidden overflow-x-auto md:block">
            <table className="table w-full">
              <thead className="uppercase">
                <tr>
                  <th>Qté</th>
                  <th>Description</th>
                  <th>Prix unit. HT</th>
                  <th>Montant HT</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id}>
                    <td>
                      <input
                        type="number"
                        value={line.quantity}
                        className="input input-sm input-bordered w-20"
                        min={0}
                        onChange={(e) =>
                          updateLine(index, {
                            quantity:
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={line.description}
                        className="input input-sm input-bordered w-full min-w-40"
                        onChange={(e) =>
                          updateLine(index, { description: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.unitPrice}
                        className="input input-sm input-bordered w-28"
                        min={0}
                        step={1}
                        onChange={(e) =>
                          updateLine(index, {
                            unitPrice:
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="whitespace-nowrap font-bold">
                      {formatMoney(line.quantity * line.unitPrice, currency)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="btn btn-sm btn-circle btn-ghost text-error"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
