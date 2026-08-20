import type { Client, Invoice } from "@/type";
import { toDateInputValue } from "@/lib/format";

interface Props {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

const InvoiceInfo = ({
  invoice,
  setInvoice,
  clients,
  onSelectClient,
}: Props) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof Invoice,
  ) => {
    setInvoice({ ...invoice, [field]: e.target.value });
  };

  return (
    <div className="mb-4 flex h-fit flex-col rounded-xl bg-base-200 p-5 md:mb-0">
      <div className="space-y-4">
        <h2 className="badge badge-info">Émetteur</h2>
        <input
          type="text"
          value={invoice.issuerName}
          placeholder="Nom de l'entreprise émettrice"
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "issuerName")}
        />
        <textarea
          value={invoice.issuerAddress}
          placeholder="Adresse de l'entreprise émettrice"
          className="textarea textarea-bordered h-32 w-full resize-none"
          onChange={(e) => handleInputChange(e, "issuerAddress")}
        />

        <h2 className="badge badge-info">Client</h2>
        {clients.length > 0 && (
          <select
            className="select select-bordered w-full"
            value={invoice.clientId || ""}
            onChange={(e) => {
              if (e.target.value) onSelectClient(e.target.value);
            }}
          >
            <option value="">Choisir un client enregistré…</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={invoice.clientName}
          placeholder="Nom du client"
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "clientName")}
        />
        <textarea
          value={invoice.clientAddress}
          placeholder="Adresse du client"
          className="textarea textarea-bordered h-32 w-full resize-none"
          onChange={(e) => handleInputChange(e, "clientAddress")}
        />
        <input
          type="email"
          value={invoice.clientEmail || ""}
          placeholder="Email du client (pour envoi)"
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "clientEmail")}
        />

        <h2 className="badge badge-info">Date de la facture</h2>
        <input
          type="date"
          value={toDateInputValue(invoice.invoiceDate)}
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "invoiceDate")}
        />

        <h2 className="badge badge-info">Date d&apos;échéance</h2>
        <input
          type="date"
          value={toDateInputValue(invoice.dueDate)}
          className="input input-bordered w-full"
          onChange={(e) => handleInputChange(e, "dueDate")}
        />

        <h2 className="badge badge-info">Notes (PDF)</h2>
        <textarea
          value={invoice.notes || ""}
          placeholder="Notes ou remarques affichées sur la facture PDF…"
          className="textarea textarea-bordered h-24 w-full resize-none"
          onChange={(e) => handleInputChange(e, "notes")}
        />
      </div>
    </div>
  );
};

export default InvoiceInfo;
