import { getPublicInvoice } from "@/app/actions-portal";
import { formatDisplayDate, formatMoney } from "@/lib/format";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  LayersPlus,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicInvoiceView from "@/app/components/PublicInvoiceView";
import { MixxByYasLogo, MoovMoneyLogo } from "@/app/components/PaymentMethodLogo";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicInvoicePage({ params }: PageProps) {
  const { token } = await params;
  const invoice = await getPublicInvoice(token);

  if (!invoice) {
    notFound();
  }

  const company = invoice.organization.companyProfile;
  const totalHT = invoice.lines.reduce(
    (acc, l) => acc + l.quantity * l.unitPrice,
    0,
  );
  const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0;
  const totalTTC = totalHT + totalVAT;

  const totalPaid = (invoice.payments || []).reduce(
    (acc, p) => acc + p.amount,
    0,
  );
  const remainingDue = Math.max(0, totalTTC - totalPaid);

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
                Portail Client Sécurisé
              </div>
              <h1 className="text-lg font-bold">
                Facture {invoice.number}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status === "PAID" || remainingDue === 0 ? (
              <span className="badge badge-success gap-1 text-xs py-3 px-3">
                <CheckCircle className="h-4 w-4" /> Payée
              </span>
            ) : invoice.status === "OVERDUE" ? (
              <span className="badge badge-error gap-1 text-xs py-3 px-3">
                <XCircle className="h-4 w-4" /> Impayée
              </span>
            ) : (
              <span className="badge badge-warning gap-1 text-xs py-3 px-3">
                <Clock className="h-4 w-4" /> En attente de règlement
              </span>
            )}
          </div>
        </div>

        {/* Détail de la facture & téléchargement */}
        <PublicInvoiceView
          invoice={invoice}
          totals={{ totalHT, totalVAT, totalTTC, totalPaid, remainingDue }}
          company={company}
        />

        {/* Moyens de règlement acceptés au Togo */}
        {remainingDue > 0 && (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-base-content">
              <Smartphone className="h-4 w-4 text-info" />
              Moyens de paiement acceptés au Togo
            </div>
            <p className="text-xs text-base-content/70">
              Vous pouvez régler cette facture directement par Mobile Money ou virement bancaire :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-base-200 bg-base-200/40">
                <MixxByYasLogo size="lg" showText={true} />
                {company?.phone && (
                  <span className="badge badge-sm badge-ghost font-mono text-xs">{company.phone}</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-base-200 bg-base-200/40">
                <MoovMoneyLogo size="lg" showText={true} />
                {company?.phone && (
                  <span className="badge badge-sm badge-ghost font-mono text-xs">{company.phone}</span>
                )}
              </div>
            </div>

            {company?.iban && (
              <div className="text-xs text-base-content/80 pt-1">
                <span className="font-semibold">Virement bancaire (IBAN) :</span>{" "}
                <code className="font-mono bg-base-200 px-1.5 py-0.5 rounded text-[11px]">{company.iban}</code>
              </div>
            )}
          </div>
        )}

        {/* Pied de page public */}
        <div className="text-center text-xs text-base-content/50 py-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-info" />
          Document officiel généré de manière sécurisée avec FactuPro
        </div>
      </div>
    </div>
  );
}
