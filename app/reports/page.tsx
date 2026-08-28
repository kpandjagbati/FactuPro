"use client";

import { useEffect, useState } from "react";
import {
  exportAccountingExcel,
  exportAccountingZip,
  getAccountingReport,
} from "@/app/actions-reports";
import Wrapper from "@/app/components/Wrapper";
import { downloadBase64File } from "@/lib/download";
import { formatMoney } from "@/lib/format";
import type { AccountingReport } from "@/type";
import {
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [activeTab, setActiveTab] = useState<"sales" | "expenses" | "credits">("sales");

  const [report, setReport] = useState<AccountingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  const fetchReport = async (start: string, end: string) => {
    try {
      setLoading(true);
      const data = await getAccountingReport(start, end);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(startDate, endDate);
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(startDate, endDate);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    setStartDate(start);
    setEndDate(end);
    fetchReport(start, end);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await exportAccountingExcel(startDate, endDate);
      downloadBase64File(
        res.base64,
        res.filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportZip = async () => {
    setExportingZip(true);
    try {
      const res = await exportAccountingZip(startDate, endDate);
      downloadBase64File(
        res.base64,
        res.filename,
        "application/zip",
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export ZIP.");
    } finally {
      setExportingZip(false);
    }
  };

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <Calculator className="h-7 w-7 text-info" />
              Rapports & Journal Comptable
            </h1>
            <p className="text-sm text-base-content/70">
              Livre des recettes, TVA collectée, synthèse fiscale et exports complets pour votre comptabilité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading || !report}
              className="btn btn-outline btn-sm sm:btn-md gap-2 shadow-sm"
            >
              {exporting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 text-success" />
                  Journal (Excel)
                </>
              )}
            </button>

            <button
              onClick={handleExportZip}
              disabled={exportingZip || loading || !report}
              className="btn btn-info btn-sm sm:btn-md gap-2 shadow-sm"
            >
              {exportingZip ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Archive Dossier (ZIP)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filtres de Période */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-base-100 p-4 border border-base-300 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-base-content/60">
              Exercice :
            </span>
            <div className="flex gap-1">
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <button
                  key={y}
                  onClick={() => handleYearChange(y.toString())}
                  className={`btn btn-xs sm:btn-sm ${
                    selectedYear === y.toString() ? "btn-neutral" : "btn-ghost"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-base-content/60">Du</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered input-xs sm:input-sm"
            />
            <span className="text-base-content/60">au</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered input-xs sm:input-sm"
            />
            <button type="submit" className="btn btn-xs sm:btn-sm btn-outline">
              Filtrer
            </button>
          </form>
        </div>

        {/* KPI Synthèse Fiscale */}
        {loading || !report ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-info" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* CA Encaissé */}
              <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">Total Encaissé</span>
                  <Wallet className="h-4 w-4 text-success" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-success">
                  {formatMoney(report.totalPaidTTC, report.currency)}
                </div>
                <p className="mt-1 text-xs text-base-content/50">
                  Sur {formatMoney(report.totalInvoicedTTC, report.currency)} facturé TTC
                </p>
              </div>

              {/* TVA Collectée */}
              <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">TVA Collectée</span>
                  <DollarSign className="h-4 w-4 text-info" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-info">
                  {formatMoney(report.totalInvoicedVAT, report.currency)}
                </div>
                <p className="mt-1 text-xs text-base-content/50">
                  TVA exigible sur les ventes
                </p>
              </div>

              {/* Dépenses & Avoirs */}
              <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">Charges & Avoirs</span>
                  <TrendingDown className="h-4 w-4 text-error" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-error">
                  - {formatMoney(report.totalExpenses + report.totalCreditNotesTTC, report.currency)}
                </div>
                <p className="mt-1 text-xs text-base-content/50">
                  Dépenses : {formatMoney(report.totalExpenses, report.currency)} • Avoirs : {formatMoney(report.totalCreditNotesTTC, report.currency)}
                </p>
              </div>

              {/* Résultat Net */}
              <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">Bénéfice Réel</span>
                  <TrendingUp
                    className={`h-4 w-4 ${
                      report.netProfit >= 0 ? "text-success" : "text-error"
                    }`}
                  />
                </div>
                <div
                  className={`mt-2 text-2xl font-extrabold ${
                    report.netProfit >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  {formatMoney(report.netProfit, report.currency)}
                </div>
                <p className="mt-1 text-xs text-base-content/50">
                  Encaissé - Dépenses - Avoirs
                </p>
              </div>
            </div>

            {/* Onglets des journaux */}
            <div className="space-y-4">
              <div className="tabs tabs-boxed bg-base-200/70 p-1 w-fit rounded-xl">
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`tab tab-sm sm:tab-md ${
                    activeTab === "sales" ? "tab-active font-bold" : ""
                  }`}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Journal des Ventes ({report.salesJournal.length})
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`tab tab-sm sm:tab-md ${
                    activeTab === "expenses" ? "tab-active font-bold" : ""
                  }`}
                >
                  <Receipt className="h-4 w-4 mr-1.5" />
                  Journal des Dépenses ({report.expensesJournal.length})
                </button>
                <button
                  onClick={() => setActiveTab("credits")}
                  className={`tab tab-sm sm:tab-md ${
                    activeTab === "credits" ? "tab-active font-bold" : ""
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4 mr-1.5" />
                  Avoirs ({report.creditNotesJournal.length})
                </button>
              </div>

              {/* Contenu de l'onglet Ventes */}
              {activeTab === "sales" && (
                <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                  <table className="table w-full">
                    <thead className="bg-base-200/50 text-xs uppercase text-base-content/70">
                      <tr>
                        <th>Date</th>
                        <th>N° Facture</th>
                        <th>Client</th>
                        <th>Statut</th>
                        <th className="text-right">Total HT</th>
                        <th className="text-right">TVA</th>
                        <th className="text-right">Total TTC</th>
                        <th className="text-right">Encaissé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200 text-sm">
                      {report.salesJournal.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-base-content/60">
                            Aucune vente sur cette période.
                          </td>
                        </tr>
                      ) : (
                        report.salesJournal.map((row) => (
                          <tr key={row.id} className="hover:bg-base-200/30">
                            <td className="whitespace-nowrap text-xs text-base-content/70">
                              {row.date
                                ? new Date(row.date).toLocaleDateString("fr-FR")
                                : "—"}
                            </td>
                            <td>
                              <Link
                                href={`/invoice/${row.id}`}
                                className="font-mono text-xs font-bold text-info hover:underline"
                              >
                                {row.number}
                              </Link>
                            </td>
                            <td className="font-semibold text-slate-800">
                              {row.clientName}
                            </td>
                            <td>
                              <span
                                className={`badge badge-xs text-[10px] ${
                                  row.status === "PAID"
                                    ? "badge-success text-white"
                                    : row.status === "OVERDUE"
                                    ? "badge-error text-white"
                                    : "badge-ghost"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {formatMoney(row.totalHT, report.currency)}
                            </td>
                            <td className="text-right whitespace-nowrap text-base-content/70">
                              {formatMoney(row.totalVAT, report.currency)}
                            </td>
                            <td className="text-right font-bold whitespace-nowrap">
                              {formatMoney(row.totalTTC, report.currency)}
                            </td>
                            <td className="text-right font-bold text-success whitespace-nowrap">
                              {formatMoney(row.paidAmount, report.currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contenu de l'onglet Dépenses */}
              {activeTab === "expenses" && (
                <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                  <table className="table w-full">
                    <thead className="bg-base-200/50 text-xs uppercase text-base-content/70">
                      <tr>
                        <th>Date</th>
                        <th>Titre</th>
                        <th>Catégorie</th>
                        <th className="text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200 text-sm">
                      {report.expensesJournal.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-base-content/60">
                            Aucune dépense sur cette période.
                          </td>
                        </tr>
                      ) : (
                        report.expensesJournal.map((row) => (
                          <tr key={row.id} className="hover:bg-base-200/30">
                            <td className="whitespace-nowrap text-xs text-base-content/70">
                              {new Date(row.date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="font-semibold text-slate-800">
                              {row.title}
                            </td>
                            <td>
                              <span className="badge badge-sm badge-ghost">
                                {row.category}
                              </span>
                            </td>
                            <td className="text-right font-bold text-error whitespace-nowrap">
                              - {formatMoney(row.amount, report.currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contenu de l'onglet Avoirs */}
              {activeTab === "credits" && (
                <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
                  <table className="table w-full">
                    <thead className="bg-base-200/50 text-xs uppercase text-base-content/70">
                      <tr>
                        <th>Date</th>
                        <th>N° Avoir</th>
                        <th>Facture d&apos;origine</th>
                        <th>Client</th>
                        <th className="text-right">Total HT</th>
                        <th className="text-right">TVA</th>
                        <th className="text-right">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200 text-sm">
                      {report.creditNotesJournal.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-base-content/60">
                            Aucun avoir émis sur cette période.
                          </td>
                        </tr>
                      ) : (
                        report.creditNotesJournal.map((row) => (
                          <tr key={row.id} className="hover:bg-base-200/30">
                            <td className="whitespace-nowrap text-xs text-base-content/70">
                              {new Date(row.date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="font-mono text-xs font-bold text-error">
                              {row.number}
                            </td>
                            <td>{row.invoiceNumber || "—"}</td>
                            <td className="font-semibold">{row.clientName}</td>
                            <td className="text-right whitespace-nowrap">
                              - {formatMoney(row.totalHT, report.currency)}
                            </td>
                            <td className="text-right whitespace-nowrap text-base-content/70">
                              - {formatMoney(row.totalVAT, report.currency)}
                            </td>
                            <td className="text-right font-bold text-error whitespace-nowrap">
                              - {formatMoney(row.totalTTC, report.currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Wrapper>
  );
}
