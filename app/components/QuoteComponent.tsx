import type { Quote, QuoteStatus } from "@/type";
import { formatMoney } from "@/lib/format";
import {
  CheckCircle,
  Clock,
  FileText,
  SquareArrowOutUpRight,
  XCircle,
} from "lucide-react";
import Link from "next/link";

const getStatusBadge = (status: QuoteStatus) => {
  switch (status) {
    case "DRAFT":
      return (
        <div className="badge badge-lg flex items-center gap-2">
          <FileText className="w-4" /> Brouillon
        </div>
      );
    case "SENT":
      return (
        <div className="badge badge-lg badge-warning flex items-center gap-2">
          <Clock className="w-4" /> Envoyé
        </div>
      );
    case "ACCEPTED":
      return (
        <div className="badge badge-lg badge-success flex items-center gap-2">
          <CheckCircle className="w-4" /> Accepté
        </div>
      );
    case "REJECTED":
      return (
        <div className="badge badge-lg badge-error flex items-center gap-2">
          <XCircle className="w-4" /> Refusé
        </div>
      );
    case "CONVERTED":
      return (
        <div className="badge badge-lg badge-info flex items-center gap-2">
          <CheckCircle className="w-4" /> Converti
        </div>
      );
    default:
      return <div className="badge badge-lg">Indéfini</div>;
  }
};

const QuoteComponent = ({ quote }: { quote: Quote }) => {
  const totalHT =
    quote.lines?.reduce(
      (acc, line) => acc + (line.quantity ?? 0) * (line.unitPrice ?? 0),
      0,
    ) ?? 0;
  const totalVAT = quote.vatActive ? totalHT * (quote.vatRate / 100) : 0;

  return (
    <div className="space-y-2 rounded-xl bg-base-200/90 p-5 shadow">
      <div className="flex w-full items-center justify-between">
        <div>{getStatusBadge(quote.status)}</div>
        <Link className="btn btn-info btn-sm" href={`/quote/${quote.id}`}>
          Plus
          <SquareArrowOutUpRight className="w-4" />
        </Link>
      </div>
      <div className="stat-title">
        <div className="text-sm uppercase">{quote.number}</div>
      </div>
      <div className="stat-value text-2xl">
        {formatMoney(totalHT + totalVAT, quote.currency)}
      </div>
      <div className="stat-desc">{quote.name}</div>
    </div>
  );
};

export default QuoteComponent;
