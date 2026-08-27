import { getPublicQuote } from "@/app/actions-portal";
import { formatDisplayDate, formatMoney } from "@/lib/format";
import {
  CheckCircle,
  FileCheck,
  LayersPlus,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import PublicQuoteView from "@/app/components/PublicQuoteView";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const quote = await getPublicQuote(token);

  if (!quote) {
    notFound();
  }

  const company = quote.organization.companyProfile;
  const totalHT = quote.lines.reduce(
    (acc, l) => acc + l.quantity * l.unitPrice,
    0,
  );
  const totalVAT = quote.vatActive ? totalHT * (quote.vatRate / 100) : 0;
  const totalTTC = totalHT + totalVAT;

  return (
    <div className="min-h-screen bg-base-200/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Barre d'en-tête client */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-base-100 p-4 sm:p-5 shadow-sm border border-base-300">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-info p-2 text-info-content">
              <LayersPlus className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-info">
                Portail Devis & Signature
              </div>
              <h1 className="text-lg font-bold">
                Devis {quote.number}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quote.status === "ACCEPTED" || quote.status === "CONVERTED" ? (
              <span className="badge badge-success gap-1 text-xs py-3 px-3">
                <CheckCircle className="h-4 w-4" /> Devis Signé & Accepté
              </span>
            ) : quote.status === "REJECTED" ? (
              <span className="badge badge-error gap-1 text-xs py-3 px-3">
                <XCircle className="h-4 w-4" /> Devis Refusé
              </span>
            ) : (
              <span className="badge badge-warning gap-1 text-xs py-3 px-3">
                <FileCheck className="h-4 w-4" /> En attente de signature
              </span>
            )}
          </div>
        </div>

        {/* Vue du devis & formulaire de signature */}
        <PublicQuoteView
          quote={quote}
          totals={{ totalHT, totalVAT, totalTTC }}
          company={company}
          token={token}
        />

        {/* Pied de page public */}
        <div className="text-center text-xs text-base-content/50 py-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-info" />
          Signature électronique horodatée et sécurisée par FactuPro
        </div>
      </div>
    </div>
  );
}
