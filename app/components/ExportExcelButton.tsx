"use client";

import { downloadBase64File } from "@/lib/download";
import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";

type ExportFn = () => Promise<{ base64: string; filename: string }>;

type Props = {
  exportFn: ExportFn;
  label?: string;
  className?: string;
};

export default function ExportExcelButton({
  exportFn,
  label = "Exporter Excel",
  className = "btn btn-sm btn-outline btn-success",
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { base64, filename } = await exportFn();
      downloadBase64File(base64, filename);
    } catch (error) {
      console.error(error);
      alert("Impossible de générer le fichier Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={handleExport}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        <>
          {label}
          <FileSpreadsheet className="ml-2 h-4 w-4" />
        </>
      )}
    </button>
  );
}
