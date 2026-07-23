"use client";

import { createEmptyQuote, getQuotes } from "@/app/actions-v2";
import QuoteComponent from "@/app/components/QuoteComponent";
import Wrapper from "@/app/components/Wrapper";
import type { Quote } from "@/type";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setQuotes(await getQuotes());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (quote) =>
        quote.name.toLowerCase().includes(q) ||
        quote.number.toLowerCase().includes(q) ||
        quote.clientName.toLowerCase().includes(q),
    );
  }, [quotes, search]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createEmptyQuote(name);
      await load();
      setName("");
      (document.getElementById("create_quote_modal") as HTMLDialogElement)?.close();
      const { default: confetti } = await import("canvas-confetti");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
    } catch (error) {
      console.error(error);
      alert("Impossible de créer le devis.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex flex-col space-y-4">
        <h1 className="text-lg font-bold">Mes devis</h1>
        <input
          className="input input-bordered w-full max-w-md"
          placeholder="Rechercher un devis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <span className="loading loading-spinner loading-md text-info" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-info p-5 transition hover:bg-base-200"
              onClick={() =>
                (
                  document.getElementById("create_quote_modal") as HTMLDialogElement
                )?.showModal()
              }
            >
              <div className="font-bold text-info">Créer un devis</div>
              <div className="mt-2 rounded-full bg-info p-2 text-info-content">
                <Plus className="h-6 w-6" />
              </div>
            </div>
            {filtered.map((quote) => (
              <QuoteComponent key={quote.id} quote={quote} />
            ))}
          </div>
        )}

        <dialog id="create_quote_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <h3 className="text-lg font-bold">Nouveau devis</h3>
            <input
              className="input input-bordered my-4 w-full"
              placeholder="Nom du devis"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="btn btn-info"
              disabled={!name.trim() || creating}
              onClick={handleCreate}
            >
              {creating ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Créer"
              )}
            </button>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    </Wrapper>
  );
}
