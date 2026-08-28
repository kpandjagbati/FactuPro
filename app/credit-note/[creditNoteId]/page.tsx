"use client";

import { useEffect, useState } from "react";
import { getCompanyProfile } from "@/app/actions";
import { getCreditNoteById } from "@/app/actions-credit-notes";
import CreditNotePDF from "@/app/components/CreditNotePDF";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { CompanyProfile, CreditNote, Totals } from "@/type";
import { ArrowLeft, FileMinus, FileText } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function CreditNoteDetailPage() {
  const params = useParams<{ creditNoteId: string }>();
  const router = useRouter();
  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cn, comp] = await Promise.all([
          getCreditNoteById(params.creditNoteId),
          getCompanyProfile(),
        ]);
        if (!cn) return;
        setCreditNote(cn);
        setCompany(comp);

        const ht = cn.lines.reduce(
          (acc, l) => acc + l.quantity * l.unitPrice,
          0,
        );
        const vat = cn.vatActive ? ht * (cn.vatRate / 100) : 0;
        setTotals({ totalHT: ht, totalVAT: vat, totalTTC: ht + vat });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.creditNoteId) void load();
  }, [params.creditNoteId]);

  if (loading || !creditNote || !totals) {
    return (
      <Wrapper>
        <div className="flex h-64 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-info" />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/credit-notes"
              className="btn btn-ghost btn-sm btn-circle"
              title="Retour aux avoirs"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <span className="badge badge-error text-white font-mono text-xs">
                {creditNote.number}
              </span>
              <h1 className="text-xl font-bold mt-1">
                Avoir pour {creditNote.clientName || "Client"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {creditNote.invoice && (
              <Link
                href={`/invoice/${creditNote.invoice.id}`}
                className="btn btn-sm btn-outline gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Voir la facture d&apos;origine ({creditNote.invoice.number})
              </Link>
            )}
          </div>
        </div>

        {/* Détail & PDF */}
        <CreditNotePDF
          creditNote={creditNote}
          totals={totals}
          company={company}
        />
      </div>
    </Wrapper>
  );
}
