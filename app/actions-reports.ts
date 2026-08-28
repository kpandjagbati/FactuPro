"use server";

import prisma from "@/lib/prisma";
import type { AccountingReport } from "@/type";
import { auth } from "@clerk/nextjs/server";
import ExcelJS from "exceljs";
import JSZip from "jszip";

async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: { companyProfile: true },
      },
    },
  });

  if (!user) throw new Error("Utilisateur introuvable. Rechargez la page.");
  return user;
}

export async function getAccountingReport(
  startStr?: string,
  endStr?: string,
): Promise<AccountingReport> {
  const user = await requireDbUser();
  const orgId = user.organizationId;
  const currency = user.organization.currency || "XOF";

  const now = new Date();
  const start = startStr
    ? new Date(startStr)
    : new Date(now.getFullYear(), 0, 1);
  const end = endStr
    ? new Date(endStr)
    : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const [invoices, expenses, creditNotes] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: start, lte: end },
      },
      include: { lines: true, payments: true, client: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: orgId,
        expenseDate: { gte: start, lte: end },
      },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.creditNote.findMany({
      where: {
        organizationId: orgId,
        creditDate: { gte: start, lte: end },
      },
      include: { lines: true, invoice: true },
      orderBy: { creditDate: "asc" },
    }),
  ]);

  let totalInvoicedHT = 0;
  let totalInvoicedVAT = 0;
  let totalInvoicedTTC = 0;
  let totalPaidTTC = 0;

  const salesJournal = invoices.map((inv) => {
    const ht = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vat = inv.vatActive ? ht * (inv.vatRate / 100) : 0;
    const ttc = ht + vat;
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);

    totalInvoicedHT += ht;
    totalInvoicedVAT += vat;
    totalInvoicedTTC += ttc;
    totalPaidTTC += paid;

    return {
      id: inv.id,
      date: inv.invoiceDate || inv.createdAt,
      number: inv.number,
      clientName: inv.clientName || inv.client?.name || "Sans client",
      status: inv.status,
      totalHT: ht,
      totalVAT: vat,
      totalTTC: ttc,
      paidAmount: paid,
    };
  });

  let totalExpenses = 0;
  const expensesJournal = expenses.map((exp) => {
    totalExpenses += exp.amount;
    return {
      id: exp.id,
      date: exp.expenseDate,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
    };
  });

  let totalCreditNotesTTC = 0;
  const creditNotesJournal = creditNotes.map((cn) => {
    const ht = cn.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vat = cn.vatActive ? ht * (cn.vatRate / 100) : 0;
    const ttc = ht + vat;
    totalCreditNotesTTC += ttc;

    return {
      id: cn.id,
      date: cn.creditDate,
      number: cn.number,
      invoiceNumber: cn.invoice?.number || null,
      clientName: cn.clientName || "—",
      totalHT: ht,
      totalVAT: vat,
      totalTTC: ttc,
    };
  });

  const netProfit = totalPaidTTC - totalExpenses - totalCreditNotesTTC;

  return {
    period: {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    },
    currency,
    totalInvoicedHT,
    totalInvoicedVAT,
    totalInvoicedTTC,
    totalPaidTTC,
    totalCreditNotesTTC,
    totalExpenses,
    netProfit,
    salesJournal,
    expensesJournal,
    creditNotesJournal,
  };
}

export async function exportAccountingExcel(
  startStr?: string,
  endStr?: string,
) {
  const report = await getAccountingReport(startStr, endStr);
  const user = await requireDbUser();
  const companyName = user.organization.companyProfile?.name || "FactuPro";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FactuPro";
  workbook.created = new Date();

  // 1. Feuille Synthèse
  const summarySheet = workbook.addWorksheet("Synthèse Financière");
  summarySheet.columns = [
    { header: "Indicateur", key: "kpi", width: 35 },
    { header: `Montant (${report.currency})`, key: "amount", width: 25 },
  ];

  summarySheet.addRows([
    { kpi: "Chiffre d'Affaires Facturé HT", amount: report.totalInvoicedHT },
    { kpi: "TVA Collectée sur Factures", amount: report.totalInvoicedVAT },
    { kpi: "Chiffre d'Affaires Facturé TTC", amount: report.totalInvoicedTTC },
    { kpi: "Total Encaissé (Paiements reçus)", amount: report.totalPaidTTC },
    { kpi: "Total Avoirs / Notes de crédit", amount: -report.totalCreditNotesTTC },
    { kpi: "Total Dépenses & Charges", amount: -report.totalExpenses },
    { kpi: "Bénéfice Net Période", amount: report.netProfit },
  ]);

  // Style Header
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0284C7" },
  };

  // 2. Feuille Journal des Ventes
  const salesSheet = workbook.addWorksheet("Journal des Ventes");
  salesSheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "N° Facture", key: "number", width: 18 },
    { header: "Client", key: "client", width: 28 },
    { header: "Statut", key: "status", width: 15 },
    { header: "Total HT", key: "ht", width: 16 },
    { header: "TVA", key: "vat", width: 16 },
    { header: "Total TTC", key: "ttc", width: 18 },
    { header: "Montant Payé", key: "paid", width: 18 },
  ];

  salesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  salesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0284C7" },
  };

  report.salesJournal.forEach((row) => {
    salesSheet.addRow({
      date: row.date ? new Date(row.date).toLocaleDateString("fr-FR") : "—",
      number: row.number,
      client: row.clientName,
      status: row.status,
      ht: row.totalHT,
      vat: row.totalVAT,
      ttc: row.totalTTC,
      paid: row.paidAmount,
    });
  });

  // 3. Feuille Journal des Dépenses
  const expSheet = workbook.addWorksheet("Journal des Dépenses");
  expSheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Titre", key: "title", width: 30 },
    { header: "Catégorie", key: "category", width: 25 },
    { header: "Montant", key: "amount", width: 18 },
  ];

  expSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  expSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDC2626" },
  };

  report.expensesJournal.forEach((row) => {
    expSheet.addRow({
      date: new Date(row.date).toLocaleDateString("fr-FR"),
      title: row.title,
      category: row.category,
      amount: row.amount,
    });
  });

  // 4. Feuille Avoirs
  if (report.creditNotesJournal.length > 0) {
    const cnSheet = workbook.addWorksheet("Avoirs");
    cnSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "N° Avoir", key: "number", width: 18 },
      { header: "Facture liée", key: "inv", width: 18 },
      { header: "Client", key: "client", width: 28 },
      { header: "Total HT", key: "ht", width: 16 },
      { header: "TVA", key: "vat", width: 16 },
      { header: "Total TTC", key: "ttc", width: 18 },
    ];

    cnSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    cnSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" },
    };

    report.creditNotesJournal.forEach((row) => {
      cnSheet.addRow({
        date: new Date(row.date).toLocaleDateString("fr-FR"),
        number: row.number,
        inv: row.invoiceNumber || "—",
        client: row.clientName,
        ht: row.totalHT,
        vat: row.totalVAT,
        ttc: row.totalTTC,
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `Rapport-Comptable-${report.period.start}-au-${report.period.end}.xlsx`;

  return { base64, filename };
}

export async function exportAccountingZip(
  startStr?: string,
  endStr?: string,
) {
  const user = await requireDbUser();
  const orgId = user.organizationId;
  const companyName = user.organization.companyProfile?.name || user.organization.name;

  const now = new Date();
  const start = startStr
    ? new Date(startStr)
    : new Date(now.getFullYear(), 0, 1);
  const end = endStr
    ? new Date(endStr)
    : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const [report, excelData, invoices, creditNotes] = await Promise.all([
    getAccountingReport(startStr, endStr),
    exportAccountingExcel(startStr, endStr),
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: start, lte: end },
      },
      include: { lines: true, payments: true, client: true },
    }),
    prisma.creditNote.findMany({
      where: {
        organizationId: orgId,
        creditDate: { gte: start, lte: end },
      },
      include: { lines: true, invoice: true },
    }),
  ]);

  const zip = new JSZip();

  // 1. Ajouter le classeur Excel principal
  const excelBuffer = Buffer.from(excelData.base64, "base64");
  zip.file(excelData.filename, excelBuffer);

  // 2. Fichier texte de synthèse
  const summaryText = `=======================================================
DOSSIER COMPTABLE & RELEVÉ FISCAL - FACTUPRO
=======================================================
Entreprise : ${companyName}
Période    : du ${report.period.start} au ${report.period.end}
Devise     : ${report.currency}

RÉSUMÉ DES CHIFFRES CLÉS :
-------------------------------------------------------
- CA Facturé HT             : ${report.totalInvoicedHT.toLocaleString("fr-FR")} ${report.currency}
- TVA Collectée             : ${report.totalInvoicedVAT.toLocaleString("fr-FR")} ${report.currency}
- CA Facturé TTC            : ${report.totalInvoicedTTC.toLocaleString("fr-FR")} ${report.currency}
- Total Encaissé Réel       : ${report.totalPaidTTC.toLocaleString("fr-FR")} ${report.currency}
- Total Avoirs Déductibles  : ${report.totalCreditNotesTTC.toLocaleString("fr-FR")} ${report.currency}
- Total Dépenses / Charges  : ${report.totalExpenses.toLocaleString("fr-FR")} ${report.currency}
-------------------------------------------------------
BÉNÉFICE NET DE LA PÉRIODE  : ${report.netProfit.toLocaleString("fr-FR")} ${report.currency}
=======================================================
Généré automatiquement par FactuPro le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}.
`;
  zip.file("00_Synthese_Comptable.txt", summaryText);

  // 3. Dossier Factures avec détails
  const invoicesFolder = zip.folder("Factures");
  if (invoicesFolder) {
    invoices.forEach((inv) => {
      const invLines = inv.lines
        .map(
          (l, i) =>
            `${i + 1}. ${l.description} | Qté: ${l.quantity} | PU: ${l.unitPrice} | Total: ${l.quantity * l.unitPrice}`,
        )
        .join("\n");

      const invDetail = `FACTURE ${inv.number}
Date: ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("fr-FR") : new Date(inv.createdAt).toLocaleDateString("fr-FR")}
Statut: ${inv.status}
Client: ${inv.clientName || "—"} (${inv.clientAddress || ""})
Émetteur: ${inv.issuerName}

LIGNES :
${invLines}

TVA: ${inv.vatActive ? `${inv.vatRate}%` : "Non"}
Devise: ${inv.currency}
`;
      invoicesFolder.file(`${inv.number}.txt`, invDetail);
    });
  }

  // 4. Dossier Avoirs
  if (creditNotes.length > 0) {
    const cnFolder = zip.folder("Avoirs");
    if (cnFolder) {
      creditNotes.forEach((cn) => {
        const cnLines = cn.lines
          .map(
            (l, i) =>
              `${i + 1}. ${l.description} | Qté: ${l.quantity} | PU: ${l.unitPrice} | Total: ${l.quantity * l.unitPrice}`,
          )
          .join("\n");

        const cnDetail = `AVOIR ${cn.number}
Date: ${new Date(cn.creditDate).toLocaleDateString("fr-FR")}
Facture liée: ${cn.invoice?.number || "—"}
Motif: ${cn.reason}
Client: ${cn.clientName}

LIGNES D'AVOIR :
${cnLines}
`;
        cnFolder.file(`${cn.number}.txt`, cnDetail);
      });
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const base64 = zipBuffer.toString("base64");
  const filename = `Dossier-Comptable-${report.period.start}-au-${report.period.end}.zip`;

  return { base64, filename };
}
