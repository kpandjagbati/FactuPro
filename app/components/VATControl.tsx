interface VatFields {
  vatActive: boolean;
  vatRate: number;
}

interface Props<T extends VatFields> {
  document: T;
  setDocument: (doc: T) => void;
}

function VATControl<T extends VatFields>({ document, setDocument }: Props<T>) {
  return (
    <div className="flex items-center">
      <label className="block text-sm font-bold">TVA (%)</label>
      <input
        type="checkbox"
        className="toggle toggle-info toggle-sm ml-2"
        checked={document.vatActive}
        onChange={(e) =>
          setDocument({
            ...document,
            vatActive: e.target.checked,
            vatRate: e.target.checked ? document.vatRate || 18 : 0,
          })
        }
      />
      {document.vatActive && (
        <input
          type="number"
          value={document.vatRate}
          className="input input-sm input-bordered ml-2 w-16"
          min={0}
          onChange={(e) =>
            setDocument({
              ...document,
              vatRate: parseFloat(e.target.value) || 0,
            })
          }
        />
      )}
    </div>
  );
}

export default VATControl;
