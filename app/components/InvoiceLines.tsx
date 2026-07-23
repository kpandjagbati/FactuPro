import type { Invoice, InvoiceLine } from "@/type";
import { formatMoney } from "@/lib/format";
import { Plus, Trash } from "lucide-react";

interface Props {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
}

const InvoiceLines = ({ invoice, setInvoice }: Props) => {
  const handleAddLine = () => {
    const newLine: InvoiceLine = {
      id: `temp-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      invoiceId: invoice.id,
    };

    setInvoice({
      ...invoice,
      lines: [...invoice.lines, newLine],
    });
  };

  const updateLine = (index: number, patch: Partial<InvoiceLine>) => {
    const updatedLines = [...invoice.lines];
    updatedLines[index] = { ...updatedLines[index], ...patch };
    setInvoice({ ...invoice, lines: updatedLines });
  };

  const handleRemoveLine = (index: number) => {
    setInvoice({
      ...invoice,
      lines: invoice.lines.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="h-fit w-full rounded-xl bg-base-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="badge badge-info">Produits / Services</h2>
        <button className="btn btn-sm btn-info" onClick={handleAddLine}>
          <Plus className="w-4" />
        </button>
      </div>

      <div className="scrollable overflow-x-auto">
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
            {invoice.lines.map((line, index) => (
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
                          e.target.value === "" ? 0 : parseInt(e.target.value, 10),
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
                <td className="font-bold whitespace-nowrap">
                  {formatMoney(
                    line.quantity * line.unitPrice,
                    invoice.currency,
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleRemoveLine(index)}
                    className="btn btn-sm btn-circle btn-info"
                  >
                    <Trash className="w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoice.lines.length === 0 && (
          <p className="py-4 text-center text-sm text-base-content/60">
            Aucune ligne. Cliquez sur + pour en ajouter.
          </p>
        )}
      </div>
    </div>
  );
};

export default InvoiceLines;
