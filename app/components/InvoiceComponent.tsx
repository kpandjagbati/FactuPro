import type { Invoice, InvoiceStatus } from "@/type";
import { formatMoney } from "@/lib/format";
import {
  CheckCircle,
  Clock,
  FileText,
  SquareArrowOutUpRight,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type InvoiceComponentProps = {
  invoice: Invoice;
};

const getStatusBadge = (status: InvoiceStatus) => {
  switch (status) {
    case "DRAFT":
      return (
        <div className="badge badge-lg flex items-center gap-2">
          <FileText className="w-4" />
          Brouillon
        </div>
      );
    case "SENT":
      return (
        <div className="badge badge-lg badge-warning flex items-center gap-2">
          <Clock className="w-4" />
          En attente
        </div>
      );
    case "PAID":
      return (
        <div className="badge badge-lg badge-success flex items-center gap-2">
          <CheckCircle className="w-4" />
          Payée
        </div>
      );
    case "CANCELLED":
      return (
        <div className="badge badge-lg flex items-center gap-2">
          <XCircle className="w-4" />
          Annulée
        </div>
      );
    case "OVERDUE":
      return (
        <div className="badge badge-lg badge-error flex items-center gap-2">
          <XCircle className="w-4" />
          Impayée
        </div>
      );
    default:
      return <div className="badge badge-lg">Indéfini</div>;
  }
};

const InvoiceComponent = ({ invoice }: InvoiceComponentProps) => {
  const totalHT =
    invoice.lines?.reduce((acc, line) => {
      return acc + (line.quantity ?? 0) * (line.unitPrice ?? 0);
    }, 0) ?? 0;

  const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0;
  const totalTTC = totalHT + totalVAT;

  return (
    <div className="space-y-2 rounded-xl bg-base-200/90 p-5 shadow">
      <div className="flex w-full items-center justify-between">
        <div>{getStatusBadge(invoice.status)}</div>
        <Link className="btn btn-info btn-sm" href={`/invoice/${invoice.id}`}>
          Plus
          <SquareArrowOutUpRight className="w-4" />
        </Link>
      </div>

      <div className="w-full">
        <div className="stat-title">
          <div className="text-sm uppercase">{invoice.number}</div>
        </div>
        <div className="stat-value text-2xl">
          {formatMoney(totalTTC, invoice.currency)}
        </div>
        <div className="stat-desc">{invoice.name}</div>
      </div>
    </div>
  );
};

export default InvoiceComponent;
