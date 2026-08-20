import type { Invoice, InvoiceLine } from "@/type";
import DocumentLinesEditor, {
  type EditableLine,
} from "./DocumentLinesEditor";

interface Props {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
}

const InvoiceLines = ({ invoice, setInvoice }: Props) => {
  const lines: EditableLine[] = invoice.lines.map(
    ({ id, description, quantity, unitPrice }) => ({
      id,
      description,
      quantity,
      unitPrice,
    }),
  );

  const handleChange = (next: EditableLine[]) => {
    const mapped: InvoiceLine[] = next.map((line) => ({
      ...line,
      invoiceId: invoice.id,
    }));
    setInvoice({ ...invoice, lines: mapped });
  };

  return (
    <DocumentLinesEditor
      currency={invoice.currency}
      lines={lines}
      onChange={handleChange}
    />
  );
};

export default InvoiceLines;
