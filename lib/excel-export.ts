import ExcelJS from "exceljs";
import type { Client, Invoice, InvoiceStatus } from "@prisma/client";
import { INVOICE_STATUS_LABELS } from "@/type";
import type { DashboardStats } from "@/type";
import { formatDisplayDate, formatMoney } from "@/lib/format";

const PRIMARY = "FF0284C7";
const PRIMARY_LIGHT = "FFF0F9FF";
const INK = "FF0F172A";
const MUTED = "FF64748B";
const BORDER = "FFCBD5E1";
const WHITE = "FFFFFFFF";
const SUCCESS = "FF16A34A";
const WARNING = "FFEA580C";
const ERROR = "FFDC2626";

type CompanyInfo = {
  name: string;
  address?: string;
  email?: string | null;
  phone?: string | null;
};

function calcTTC(
  lines: { quantity: number; unitPrice: number }[],
  vatActive: boolean,
  vatRate: number,
) {
  const ht = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  const vat = vatActive ? ht * (vatRate / 100) : 0;
  return { ht, vat, ttc: ht + vat };
}

function statusFill(status: InvoiceStatus): string {
  switch (status) {
    case "PAID":
      return SUCCESS;
    case "OVERDUE":
      return ERROR;
    case "SENT":
      return WARNING;
    case "CANCELLED":
      return "FF94A3B8";
    default:
      return MUTED;
  }
}

function applyHeaderRow(
  sheet: ExcelJS.Worksheet,
  columns: string[],
  startRow = 1,
) {
  const row = sheet.getRow(startRow);
  columns.forEach((label, i) => {
    const cell = row.getCell(i + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: PRIMARY },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: BORDER } },
      bottom: { style: "thin", color: { argb: BORDER } },
      left: { style: "thin", color: { argb: BORDER } },
      right: { style: "thin", color: { argb: BORDER } },
    };
  });
  row.height = 26;
}

function styleDataCell(
  cell: ExcelJS.Cell,
  opts?: { zebra?: boolean; align?: "left" | "center" | "right"; bold?: boolean },
) {
  cell.font = {
    size: 10,
    color: { argb: opts?.bold ? INK : INK },
    bold: opts?.bold,
  };
  if (opts?.zebra) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: PRIMARY_LIGHT },
    };
  }
  cell.alignment = {
    vertical: "middle",
    horizontal: opts?.align || "left",
    wrapText: true,
  };
  cell.border = {
    top: { style: "thin", color: { argb: BORDER } },
    bottom: { style: "thin", color: { argb: BORDER } },
    left: { style: "thin", color: { argb: BORDER } },
    right: { style: "thin", color: { argb: BORDER } },
  };
}

function addBrandedTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  company: CompanyInfo,
) {
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 20, color: { argb: PRIMARY } };
  titleCell.alignment = { vertical: "middle" };

  sheet.mergeCells("A2:F2");
  const subCell = sheet.getCell("A2");
  subCell.value = subtitle;
  subCell.font = { size: 11, color: { argb: MUTED } };

  sheet.mergeCells("A3:F3");
  const companyCell = sheet.getCell("A3");
  companyCell.value = company.name;
  companyCell.font = { bold: true, size: 13, color: { argb: INK } };

  if (company.address) {
    sheet.mergeCells("A4:F4");
    sheet.getCell("A4").value = company.address;
    sheet.getCell("A4").font = { size: 10, color: { argb: MUTED } };
  }

  const contact = [company.email, company.phone].filter(Boolean).join(" · ");
  if (contact) {
    sheet.mergeCells("A5:F5");
    sheet.getCell("A5").value = contact;
    sheet.getCell("A5").font = { size: 10, color: { argb: MUTED } };
  }

  sheet.mergeCells("A6:F6");
  sheet.getCell("A6").value = `Exporté le ${new Date().toLocaleString("fr-FR")}`;
  sheet.getCell("A6").font = { italic: true, size: 9, color: { argb: MUTED } };
}

function addKpiBlock(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  label: string,
  value: string,
  color = PRIMARY,
) {
  const startCol = col;
  const endCol = col + 1;
  sheet.mergeCells(row, startCol, row + 1, endCol);
  const cell = sheet.getCell(row, startCol);
  cell.value = { richText: [{ text: label + "\n", font: { size: 10, color: { argb: MUTED } } }, { text: value, font: { bold: true, size: 16, color: { argb: color } } }] };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
  };
  cell.border = {
    top: { style: "medium", color: { argb: color } },
    bottom: { style: "thin", color: { argb: BORDER } },
    left: { style: "thin", color: { argb: BORDER } },
    right: { style: "thin", color: { argb: BORDER } },
  };
}

async function workbookToBase64(workbook: ExcelJS.Workbook): Promise<string> {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function addInvoicesSheet(
  wb: ExcelJS.Workbook,
  invoices: (Invoice & { lines: { quantity: number; unitPrice: number }[] })[],
  currency: string,
) {
  const sheet = wb.addWorksheet("Factures");
  const headers = [
    "N°",
    "Nom",
    "Client",
    "Date",
    "Échéance",
    "Statut",
    "HT",
    "TVA",
    "TTC",
    "Devise",
  ];
  sheet.columns = headers.map((h) => ({ header: h, key: h, width: h === "Nom" ? 28 : 14 }));
  applyHeaderRow(sheet, headers);

  invoices.forEach((inv, index) => {
    const { ht, vat, ttc } = calcTTC(inv.lines, inv.vatActive, inv.vatRate);
    const rowNum = index + 2;
    const row = sheet.getRow(rowNum);
    const values = [
      inv.number,
      inv.name,
      inv.clientName || "—",
      formatDisplayDate(inv.invoiceDate),
      formatDisplayDate(inv.dueDate),
      INVOICE_STATUS_LABELS[inv.status],
      ht,
      vat,
      ttc,
      inv.currency,
    ];
    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      styleDataCell(cell, {
        zebra: index % 2 === 1,
        align: colIdx >= 6 && colIdx <= 8 ? "right" : "left",
        bold: colIdx === 8,
      });
      if (colIdx >= 6 && colIdx <= 8 && typeof val === "number") {
        cell.numFmt = inv.currency === "XOF" ? "#,##0" : "#,##0.00";
      }
      if (colIdx === 5) {
        cell.font = {
          bold: true,
          size: 10,
          color: { argb: WHITE },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: statusFill(inv.status) },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
    row.height = 22;
  });

  sheet.autoFilter = { from: "A1", to: `J${Math.max(invoices.length + 1, 1)}` };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

export async function buildInvoicesWorkbook(
  invoices: (Invoice & { lines: { quantity: number; unitPrice: number }[] })[],
  company: CompanyInfo,
  currency: string,
): Promise<{ base64: string; filename: string }> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FactuPro";
  wb.created = new Date();

  const summary = wb.addWorksheet("Résumé", {
    views: [{ showGridLines: false }],
  });
  summary.properties.defaultColWidth = 18;
  addBrandedTitle(
    summary,
    "FactuPro — Export factures",
    "Récapitulatif de votre activité de facturation",
    company,
  );

  let paidTotal = 0;
  let overdueTotal = 0;
  let pendingTotal = 0;
  for (const inv of invoices) {
    const { ttc } = calcTTC(inv.lines, inv.vatActive, inv.vatRate);
    if (inv.status === "PAID") paidTotal += ttc;
    if (inv.status === "OVERDUE") overdueTotal += ttc;
    if (inv.status === "SENT") pendingTotal += ttc;
  }

  addKpiBlock(summary, 8, 1, "Factures", String(invoices.length), PRIMARY);
  addKpiBlock(
    summary,
    8,
    3,
    "CA encaissé",
    formatMoney(paidTotal, currency),
    SUCCESS,
  );
  addKpiBlock(
    summary,
    8,
    5,
    "Impayées",
    formatMoney(overdueTotal, currency),
    ERROR,
  );
  addKpiBlock(
    summary,
    11,
    1,
    "En attente",
    formatMoney(pendingTotal, currency),
    WARNING,
  );

  await addInvoicesSheet(wb, invoices, currency);

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    base64: await workbookToBase64(wb),
    filename: `FactuPro-factures-${stamp}.xlsx`,
  };
}

export async function buildClientsWorkbook(
  clients: Client[],
  company: CompanyInfo,
): Promise<{ base64: string; filename: string }> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FactuPro";

  const summary = wb.addWorksheet("Résumé", {
    views: [{ showGridLines: false }],
  });
  addBrandedTitle(
    summary,
    "FactuPro — Export clients",
    `${clients.length} client${clients.length !== 1 ? "s" : ""} enregistré${clients.length !== 1 ? "s" : ""}`,
    company,
  );
  addKpiBlock(summary, 8, 1, "Total clients", String(clients.length), PRIMARY);

  const sheet = wb.addWorksheet("Clients");
  const headers = ["Nom", "Email", "Téléphone", "Adresse", "IFU / NIF"];
  applyHeaderRow(sheet, headers);
  sheet.columns = [
    { width: 28 },
    { width: 26 },
    { width: 16 },
    { width: 36 },
    { width: 18 },
  ];

  clients.forEach((client, index) => {
    const rowNum = index + 2;
    const row = sheet.getRow(rowNum);
    [client.name, client.email || "—", client.phone || "—", client.address || "—", client.taxId || "—"].forEach(
      (val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        styleDataCell(cell, { zebra: index % 2 === 1 });
      },
    );
    row.height = 20;
  });

  sheet.autoFilter = { from: "A1", to: `E${Math.max(clients.length + 1, 1)}` };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    base64: await workbookToBase64(wb),
    filename: `FactuPro-clients-${stamp}.xlsx`,
  };
}

export async function buildDashboardWorkbook(
  stats: DashboardStats,
  invoices: (Invoice & { lines: { quantity: number; unitPrice: number }[] })[],
  company: CompanyInfo,
): Promise<{ base64: string; filename: string }> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FactuPro";

  const summary = wb.addWorksheet("Résumé", {
    views: [{ showGridLines: false }],
  });
  addBrandedTitle(
    summary,
    "FactuPro — Rapport d'activité",
    "Vue d'ensemble de votre facturation",
    company,
  );

  addKpiBlock(
    summary,
    8,
    1,
    "CA encaissé",
    formatMoney(stats.paidTotal, stats.currency),
    SUCCESS,
  );
  addKpiBlock(summary, 8, 3, "Impayées", String(stats.overdueCount), ERROR);
  addKpiBlock(summary, 8, 5, "En attente", String(stats.pendingCount), WARNING);
  addKpiBlock(
    summary,
    11,
    1,
    "Documents",
    `${stats.invoiceCount} fac. / ${stats.quoteCount} dev.`,
    PRIMARY,
  );

  const revenueSheet = wb.addWorksheet("CA mensuel");
  applyHeaderRow(revenueSheet, ["Mois", "CA encaissé", "Nb factures"]);
  revenueSheet.columns = [{ width: 16 }, { width: 20 }, { width: 14 }];
  stats.monthlyRevenue.forEach((m, i) => {
    const rowNum = i + 2;
    const row = revenueSheet.getRow(rowNum);
    [m.label, m.total, stats.monthlyInvoices[i]?.count ?? 0].forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      styleDataCell(cell, {
        zebra: i % 2 === 1,
        align: colIdx > 0 ? "right" : "left",
      });
      if (colIdx === 1 && typeof val === "number") {
        cell.numFmt = stats.currency === "XOF" ? "#,##0" : "#,##0.00";
      }
    });
  });

  const topSheet = wb.addWorksheet("Top clients");
  applyHeaderRow(topSheet, ["Client", "Total TTC"]);
  topSheet.columns = [{ width: 32 }, { width: 18 }];
  stats.topClients.forEach((c, i) => {
    const row = topSheet.getRow(i + 2);
    [c.name, c.total].forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      styleDataCell(cell, { zebra: i % 2 === 1, align: colIdx === 1 ? "right" : "left" });
      if (colIdx === 1) cell.numFmt = stats.currency === "XOF" ? "#,##0" : "#,##0.00";
    });
  });

  await addInvoicesSheet(wb, invoices, stats.currency);

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    base64: await workbookToBase64(wb),
    filename: `FactuPro-rapport-${stamp}.xlsx`,
  };
}
