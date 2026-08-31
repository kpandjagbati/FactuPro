import { getPaymentReceiptData } from "@/app/actions-payments";
import PaymentReceiptPDF from "@/app/components/PaymentReceiptPDF";
import { ArrowLeft, CheckCircle2, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ paymentId: string }>;
}

export default async function PaymentReceiptPage({ params }: PageProps) {
  const { paymentId } = await params;

  let receiptData;
  try {
    receiptData = await getPaymentReceiptData(paymentId);
  } catch {
    notFound();
  }

  const {
    payment,
    invoice,
    company,
    totalTTC,
    totalPaidUntilNow,
    remainingDue,
  } = receiptData;

  return (
    <div className="space-y-6">
      {/* En-tête de navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/invoice/${invoice.id}`}
            className="btn btn-circle btn-ghost btn-sm"
            title="Retour à la facture"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-success gap-1 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reçu validé
              </span>
              <span className="text-xs text-base-content/60 font-mono">
                Facture {invoice.number}
              </span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-info" />
              Reçu de Paiement {payment.receiptNumber}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoice/${invoice.id}`}
            className="btn btn-sm btn-outline gap-2"
          >
            Voir la facture
          </Link>
        </div>
      </div>

      {/* Rendu du PDF du reçu */}
      <PaymentReceiptPDF
        payment={payment}
        invoice={invoice}
        company={company}
        totalTTC={totalTTC}
        totalPaidUntilNow={totalPaidUntilNow}
        remainingDue={remainingDue}
      />
    </div>
  );
}
