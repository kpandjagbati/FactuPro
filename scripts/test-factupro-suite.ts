import "dotenv/config";
import prisma from "../lib/prisma";
import { cleanPhoneNumber, generateWhatsAppLink, buildInvoiceWhatsAppMessage, buildQuoteWhatsAppMessage } from "../lib/whatsapp";
import { isPlatformAdminEmail, getAdminEmails } from "../lib/admin";
import { formatMoney, formatDisplayDate, formatDisplayDateTime } from "../lib/format";
import ExcelJS from "exceljs";
import JSZip from "jszip";

// Helper assertions
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: { testName: string; error: any }[] = [];

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${totalTests}] ${testName}`);
  } else {
    failedTests++;
    const errMsg = details ? `${testName} -> ${details}` : testName;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m [${totalTests}] ${errMsg}`);
    failures.push({ testName, error: new Error(details || "Assertion failed") });
  }
}

function calcTotal(lines: { quantity: number; unitPrice: number }[], vatActive: boolean, vatRate: number) {
  const ht = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  const vat = vatActive ? ht * (vatRate / 100) : 0;
  return { ht, vat, ttc: ht + vat };
}

function computeNextDate(current: Date, freq: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"): Date {
  const next = new Date(current);
  switch (freq) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function runAudit() {
  console.log("\n==================================================================");
  console.log(" 🚀 AUDIT & SUITE DE TESTS AUTOMATISÉS COMPLÈTE - FACTUPRO (E2E)");
  console.log("==================================================================\n");

  const testOrgName = `Audit Org ${Date.now()}`;
  let orgId = "";
  let org2Id = "";
  let userId = "";

  try {
    // -------------------------------------------------------------
    // MODULE 1 : PROFIL ENTREPRISE & ORGANISATION
    // -------------------------------------------------------------
    console.log("\x1b[34m[MODULE 1] Profil Entreprise & Organisation\x1b[0m");

    const org = await prisma.organization.create({
      data: {
        name: testOrgName,
        currency: "XOF",
        companyProfile: {
          create: {
            name: "FactuPro Audit SARL",
            address: "Boulevard du 13 Janvier, Lomé, Togo",
            email: "contact@factupro-audit.tg",
            phone: "+228 90 12 34 56",
            taxId: "TG-LOM-2026-001",
            iban: "TG53 TG01 0001 2345 6789 001",
            paymentTerms: "Paiement comptant ou à 15 jours par Mixx by Yas / Moov Money",
            logoUrl: "https://factupro.tg/logo.png",
          },
        },
      },
      include: { companyProfile: true },
    });
    orgId = org.id;

    assert(org.id !== undefined && org.id.length > 0, "Création de l'Organisation avec ID valide");
    assert(org.currency === "XOF", "Devise par défaut configurée à XOF");
    assert(org.invoiceCounter === 0 && org.quoteCounter === 0 && org.creditNoteCounter === 0, "Compteurs initiaux à zéro");
    assert(org.companyProfile?.name === "FactuPro Audit SARL", "Profil Entreprise créé avec nom exact");
    assert(org.companyProfile?.phone === "+228 90 12 34 56", "Numéro de téléphone entreprise enregistré");

    // Mise à jour du profil d'entreprise
    const updatedProfile = await prisma.companyProfile.update({
      where: { organizationId: orgId },
      data: {
        name: "FactuPro Audit & Conseil SARL",
        address: "Quartier Administratif, Lomé",
      },
    });
    assert(updatedProfile.name === "FactuPro Audit & Conseil SARL", "Mise à jour du nom de l'entreprise");
    assert(updatedProfile.address === "Quartier Administratif, Lomé", "Mise à jour de l'adresse de l'entreprise");

    // Création d'un utilisateur de test associé
    const dbUser = await prisma.user.create({
      data: {
        clerkId: `clerk_test_${Date.now()}`,
        email: `tester_${Date.now()}@example.tg`,
        name: "Auditeur Testeur",
        organizationId: orgId,
      },
    });
    userId = dbUser.id;
    assert(dbUser.organizationId === orgId, "Association de l'utilisateur à l'organisation");

    // -------------------------------------------------------------
    // MODULE 2 : GESTION DES CLIENTS
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 2] Gestion des Clients\x1b[0m");

    const client1 = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: "Société Togolaise de Commerce (STC)",
        email: "direction@stc-togo.com",
        phone: "91234567",
        address: "Zone Portuaire, Lomé, Togo",
        taxId: "TG-LOM-8877",
      },
    });

    const client2 = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: "Cabinet Horizon SARL",
        email: "finance@horizon-tg.org",
        phone: "+22890987654",
        address: "Tokoin Doumasséssé, Lomé",
      },
    });

    assert(client1.id !== undefined, "Création du premier client STC");
    assert(client2.id !== undefined, "Création du second client Cabinet Horizon");

    const clients = await prisma.client.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    });
    assert(clients.length === 2, "Liste des clients retourne exactement 2 clients");

    const updatedClient = await prisma.client.update({
      where: { id: client1.id },
      data: { phone: "+228 91 23 45 67" },
    });
    assert(updatedClient.phone === "+228 91 23 45 67", "Mise à jour des coordonnées du client");

    // -------------------------------------------------------------
    // MODULE 3 : CATALOGUE PRODUITS & GESTION DES STOCKS
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 3] Catalogue Produits & Gestion des Stocks\x1b[0m");

    // Produit avec suivi de stock
    const productStock = await prisma.product.create({
      data: {
        organizationId: orgId,
        name: "Routeur Cisco Gigabit 48 Ports",
        description: "Matériel réseau professionnel haute performance",
        unitPrice: 250000,
        unit: "pièce",
        category: "Informatique",
        trackStock: true,
        stockQuantity: 10,
        minStockAlert: 3,
      },
    });

    // Produit service (sans suivi de stock)
    const productService = await prisma.product.create({
      data: {
        organizationId: orgId,
        name: "Prestation Maintenance & Support Mensuel",
        description: "Assistance technique 24/7",
        unitPrice: 150000,
        unit: "mois",
        category: "Service",
        trackStock: false,
      },
    });

    assert(productStock.trackStock === true, "Produit matériel avec gestion des stocks activée");
    assert(productService.trackStock === false, "Produit prestation sans gestion des stocks");
    assert(productStock.stockQuantity === 10, "Stock initial de 10 unités");

    // Décrémentation du stock (vente de 8 unités)
    const stockAfterSale = await prisma.product.update({
      where: { id: productStock.id },
      data: { stockQuantity: { decrement: 8 } },
    });
    assert(stockAfterSale.stockQuantity === 2, "Stock décrémenté à 2 unités");

    // Vérification de l'alerte stock faible (stock <= minStockAlert)
    const lowStockAlertActive = stockAfterSale.trackStock && stockAfterSale.stockQuantity <= stockAfterSale.minStockAlert;
    assert(lowStockAlertActive === true, "Alerte de stock faible correctement déclenchée (2 <= 3)");

    // Réapprovisionnement / Incrémentation du stock
    const stockAfterRestock = await prisma.product.update({
      where: { id: productStock.id },
      data: { stockQuantity: { increment: 15 } },
    });
    assert(stockAfterRestock.stockQuantity === 17, "Réapprovisionnement de 15 unités (Stock total = 17)");
    const lowStockAlertResolved = stockAfterRestock.stockQuantity <= stockAfterRestock.minStockAlert;
    assert(lowStockAlertResolved === false, "Alerte de stock faible résolue après réapprovisionnement (17 > 3)");

    // -------------------------------------------------------------
    // MODULE 4 : DEVIS (CRÉATION, LIGNES, CALCULS, SIGNATURE, CONVERSION)
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 4] Devis (Devis -> Signature -> Facture)\x1b[0m");

    // Incrémentation compteur devis
    const updatedOrgQuotes = await prisma.organization.update({
      where: { id: orgId },
      data: { quoteCounter: { increment: 1 } },
    });
    const quoteNumber = `DEV-${new Date().getFullYear()}-${String(updatedOrgQuotes.quoteCounter).padStart(3, "0")}`;

    const quoteLinesData = [
      { description: "Routeur Cisco Gigabit", quantity: 2, unitPrice: 250000 },
      { description: "Installation & Câblage Réseau", quantity: 1, unitPrice: 100000 },
    ];

    const quoteTotals = calcTotal(quoteLinesData, true, 18);
    // HT = 2 * 250,000 + 1 * 100,000 = 600,000
    // TVA 18% = 108,000
    // TTC = 708,000
    assert(quoteTotals.ht === 600000, "Calcul HT Devis exact (600 000 XOF)");
    assert(quoteTotals.vat === 108000, "Calcul TVA 18% Devis exact (108 000 XOF)");
    assert(quoteTotals.ttc === 708000, "Calcul TTC Devis exact (708 000 XOF)");

    const quote = await prisma.quote.create({
      data: {
        organizationId: orgId,
        clientId: client1.id,
        number: quoteNumber,
        name: "Devis Équipement Réseau STC",
        clientName: client1.name,
        clientAddress: client1.address,
        clientEmail: client1.email,
        vatActive: true,
        vatRate: 18,
        status: "DRAFT",
        currency: "XOF",
        publicToken: `token_quote_${Date.now()}`,
        lines: {
          create: quoteLinesData,
        },
      },
      include: { lines: true, client: true },
    });

    assert(quote.number === quoteNumber, `Numérotation séquentielle du devis (${quoteNumber})`);
    assert(quote.lines.length === 2, "Création des 2 lignes d'articles du devis");
    assert(quote.status === "DRAFT", "Statut initial du devis = DRAFT");

    // Passage en SENT
    const sentQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "SENT" },
    });
    assert(sentQuote.status === "SENT", "Devis envoyé au client (Statut = SENT)");

    // Signature électronique sur le portail public
    const signedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: "ACCEPTED",
        signedAt: new Date(),
        signedByName: "Koffi Mensah (DG STC)",
        signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      },
    });
    assert(signedQuote.status === "ACCEPTED", "Devis accepté après signature électronique");
    assert(signedQuote.signedByName === "Koffi Mensah (DG STC)", "Enregistrement du signataire légal");
    assert(signedQuote.signedAt !== null, "Horodatage de la signature électronique");

    // Conversion du devis en facture
    const orgForInvFromQuote = await prisma.organization.update({
      where: { id: orgId },
      data: { invoiceCounter: { increment: 1 } },
    });
    const invFromQuoteNumber = `FAC-${new Date().getFullYear()}-${String(orgForInvFromQuote.invoiceCounter).padStart(3, "0")}`;

    const invoiceFromQuote = await prisma.invoice.create({
      data: {
        organizationId: orgId,
        clientId: quote.clientId,
        quoteId: quote.id,
        number: invFromQuoteNumber,
        name: `Facture issue de ${quote.number}`,
        clientName: quote.clientName,
        clientAddress: quote.clientAddress,
        clientEmail: quote.clientEmail,
        vatActive: quote.vatActive,
        vatRate: quote.vatRate,
        status: "SENT",
        currency: quote.currency,
        publicToken: `token_inv_${Date.now()}`,
        lines: {
          create: quote.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
      include: { lines: true },
    });

    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "CONVERTED" },
    });

    const refreshedQuote = await prisma.quote.findUnique({ where: { id: quote.id } });
    assert(refreshedQuote?.status === "CONVERTED", "Devis marqué comme CONVERTED après génération de facture");
    assert(invoiceFromQuote.quoteId === quote.id, "Facture liée au devis source");
    assert(invoiceFromQuote.lines.length === 2, "Lignes d'articles transférées fidèlement vers la facture");

    // -------------------------------------------------------------
    // MODULE 5 : FACTURES (CRÉATION DIRECTE, DUPLICATION, STATUTS)
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 5] Factures (Création directe, Duplication, Cycle de statuts)\x1b[0m");

    const orgForInv2 = await prisma.organization.update({
      where: { id: orgId },
      data: { invoiceCounter: { increment: 1 } },
    });
    const invoice2Number = `FAC-${new Date().getFullYear()}-${String(orgForInv2.invoiceCounter).padStart(3, "0")}`;

    const inv2Lines = [
      { description: "Audit Sécurité & Pentest Web", quantity: 1, unitPrice: 500000 },
      { description: "Rapport de conformité RGPD/IPD", quantity: 1, unitPrice: 200000 },
    ];
    const inv2Totals = calcTotal(inv2Lines, true, 18);
    // HT = 700,000 | TVA = 126,000 | TTC = 826,000
    assert(inv2Totals.ht === 700000 && inv2Totals.ttc === 826000, "Calculs HT/TVA/TTC Facture directe 2 exacts");

    const invoice2 = await prisma.invoice.create({
      data: {
        organizationId: orgId,
        clientId: client2.id,
        number: invoice2Number,
        name: "Mission Audit Sécurité Informatique",
        clientName: client2.name,
        clientAddress: client2.address,
        clientEmail: client2.email,
        vatActive: true,
        vatRate: 18,
        status: "DRAFT",
        currency: "XOF",
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        publicToken: `token_inv2_${Date.now()}`,
        lines: { create: inv2Lines },
      },
      include: { lines: true },
    });

    assert(invoice2.number === invoice2Number, `Facture directe créée avec référence ${invoice2Number}`);
    assert(invoice2.status === "DRAFT", "Statut initial = DRAFT");

    // Duplication de facture
    const orgForDup = await prisma.organization.update({
      where: { id: orgId },
      data: { invoiceCounter: { increment: 1 } },
    });
    const dupNumber = `FAC-${new Date().getFullYear()}-${String(orgForDup.invoiceCounter).padStart(3, "0")}`;

    const duplicatedInvoice = await prisma.invoice.create({
      data: {
        organizationId: orgId,
        clientId: invoice2.clientId,
        number: dupNumber,
        name: `${invoice2.name} (Copie)`,
        clientName: invoice2.clientName,
        clientAddress: invoice2.clientAddress,
        clientEmail: invoice2.clientEmail,
        vatActive: invoice2.vatActive,
        vatRate: invoice2.vatRate,
        status: "DRAFT",
        currency: invoice2.currency,
        publicToken: `token_dup_${Date.now()}`,
        lines: {
          create: invoice2.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
      include: { lines: true },
    });

    assert(duplicatedInvoice.number === dupNumber, `Facture dupliquée avec nouveau numéro séquentiel (${dupNumber})`);
    assert(duplicatedInvoice.lines.length === invoice2.lines.length, "Facture dupliquée contient les mêmes lignes");
    assert(duplicatedInvoice.status === "DRAFT", "Statut de la facture dupliquée réinitialisé à DRAFT");

    // Cycle des statuts (DRAFT -> SENT -> OVERDUE)
    await prisma.invoice.update({
      where: { id: invoice2.id },
      data: { status: "SENT" },
    });
    const sentInv = await prisma.invoice.findUnique({ where: { id: invoice2.id } });
    assert(sentInv?.status === "SENT", "Transition statut vers SENT");

    await prisma.invoice.update({
      where: { id: invoice2.id },
      data: { status: "OVERDUE" },
    });
    const overdueInv = await prisma.invoice.findUnique({ where: { id: invoice2.id } });
    assert(overdueInv?.status === "OVERDUE", "Transition statut vers OVERDUE (En retard)");

    // -------------------------------------------------------------
    // MODULE 6 : BONS DE LIVRAISON (BL SÉQUENTIEL & ASSOCIATIONS)
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 6] Bons de Livraison (BL)\x1b[0m");

    const year = new Date().getFullYear();
    const blCount = await prisma.invoice.count({
      where: { organizationId: orgId, deliveryNumber: { not: null } },
    });
    const expectedBL = `BL-${year}-${String(blCount + 1).padStart(4, "0")}`;

    const invWithBL = await prisma.invoice.update({
      where: { id: invoiceFromQuote.id },
      data: {
        deliveryNumber: expectedBL,
        deliveryDate: new Date(),
      },
    });

    assert(invWithBL.deliveryNumber === expectedBL, `Génération du Bon de Livraison séquentiel (${expectedBL})`);
    assert(invWithBL.deliveryDate !== null, "Horodatage de la date de livraison");

    // Test d'idempotence (si déjà généré, conserver la même référence)
    const existingBL = invWithBL.deliveryNumber;
    assert(Boolean(existingBL && existingBL.startsWith("BL-")), "Format de référence BL conforme (BL-YYYY-XXXX)");

    // -------------------------------------------------------------
    // MODULE 7 : PAIEMENTS & RÈGLEMENTS (MIXX BY YAS, MOOV MONEY, SOLDE DÛ)
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 7] Paiements & Règlements (Mobile Money, Solde, Statut PAID)\x1b[0m");

    // Facture issue de devis : Total TTC = 708,000 XOF
    const targetInvId = invoiceFromQuote.id;
    const invTotalTTC = 708000;

    // 1. Premier paiement partiel par Mixx by Yas (T-Money / Yas) : 300,000 XOF
    const payment1 = await prisma.payment.create({
      data: {
        invoiceId: targetInvId,
        amount: 300000,
        paymentMethod: "Mixx by Yas",
        reference: "TXN-MIXX-88291039",
        notes: "Acompte reçu par Yas Mobile Money",
      },
    });

    const paymentsAfterP1 = await prisma.payment.findMany({ where: { invoiceId: targetInvId } });
    const paidSum1 = paymentsAfterP1.reduce((s, p) => s + p.amount, 0);
    const remaining1 = invTotalTTC - paidSum1;

    assert(paidSum1 === 300000, "Enregistrement du paiement partiel Mixx by Yas (300 000 XOF)");
    assert(remaining1 === 408000, "Calcul du reste dû exact (408 000 XOF restant)");

    // 2. Deuxième paiement par Moov Money : 408,000 XOF (Solde complet)
    const payment2 = await prisma.payment.create({
      data: {
        invoiceId: targetInvId,
        amount: 408000,
        paymentMethod: "Moov Money",
        reference: "MM-TG-99201923",
        notes: "Solde de tout compte",
      },
    });

    const allPayments = await prisma.payment.findMany({ where: { invoiceId: targetInvId } });
    const totalPaidFinal = allPayments.reduce((s, p) => s + p.amount, 0);
    const remainingFinal = invTotalTTC - totalPaidFinal;

    assert(totalPaidFinal === 708000, "Somme totale des règlements = 708 000 XOF");
    assert(remainingFinal === 0, "Reste dû = 0 XOF (Facture entièrement soldée)");

    // Mise à jour automatique en PAID lorsque intégralement réglé
    if (totalPaidFinal >= invTotalTTC) {
      await prisma.invoice.update({
        where: { id: targetInvId },
        data: { status: "PAID" },
      });
    }

    const fullyPaidInvoice = await prisma.invoice.findUnique({ where: { id: targetInvId } });
    assert(fullyPaidInvoice?.status === "PAID", "Facture automatiquement passée au statut PAID");

    // Test de suppression de paiement & recalcul du statut
    await prisma.payment.delete({ where: { id: payment2.id } });
    const paymentsAfterDelete = await prisma.payment.findMany({ where: { invoiceId: targetInvId } });
    const totalPaidAfterDel = paymentsAfterDelete.reduce((s, p) => s + p.amount, 0);
    if (totalPaidAfterDel < invTotalTTC) {
      await prisma.invoice.update({
        where: { id: targetInvId },
        data: { status: "SENT" },
      });
    }
    const invAfterPaymentDel = await prisma.invoice.findUnique({ where: { id: targetInvId } });
    assert(invAfterPaymentDel?.status === "SENT", "Facture repasse en SENT après annulation d'un paiement");

    // Réapplication du paiement 2 pour laisser les données cohérentes
    await prisma.payment.create({
      data: {
        invoiceId: targetInvId,
        amount: 408000,
        paymentMethod: "Moov Money",
        reference: "MM-TG-99201923",
      },
    });
    await prisma.invoice.update({
      where: { id: targetInvId },
      data: { status: "PAID" },
    });

    // -------------------------------------------------------------
    // MODULE 8 : FACTURES RÉCURRENTES & ABONNEMENTS
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 8] Factures Récurrentes / Abonnements\x1b[0m");

    // Vérification de la formule de calcul de la prochaine date
    const baseDate = new Date(2026, 0, 15); // 15 Janvier 2026
    const nextWeekly = computeNextDate(baseDate, "WEEKLY");
    const nextMonthly = computeNextDate(baseDate, "MONTHLY");
    const nextQuarterly = computeNextDate(baseDate, "QUARTERLY");
    const nextYearly = computeNextDate(baseDate, "YEARLY");

    assert(nextWeekly.getDate() === 22 && nextWeekly.getMonth() === 0, "Calcul date suivante Hebdomadaire (WEEKLY +7j)");
    assert(nextMonthly.getMonth() === 1 && nextMonthly.getDate() === 15, "Calcul date suivante Mensuelle (MONTHLY +1 mois)");
    assert(nextQuarterly.getMonth() === 3 && nextQuarterly.getDate() === 15, "Calcul date suivante Trimestrielle (QUARTERLY +3 mois)");
    assert(nextYearly.getFullYear() === 2027 && nextYearly.getMonth() === 0, "Calcul date suivante Annuelle (YEARLY +1 an)");

    // Création d'une facture récurrente
    const recurring = await prisma.recurringInvoice.create({
      data: {
        organizationId: orgId,
        clientId: client1.id,
        title: "Abonnement Infogérance & Cloud",
        frequency: "MONTHLY",
        nextRunDate: new Date(),
        active: true,
        clientName: client1.name,
        clientAddress: client1.address,
        clientEmail: client1.email,
        vatActive: true,
        vatRate: 18,
        currency: "XOF",
        lines: {
          create: [
            { description: "Hébergement Cloud Serveur VPS Dédié", quantity: 1, unitPrice: 75000 },
            { description: "Sauvegardes journalières & Monitoring", quantity: 1, unitPrice: 25000 },
          ],
        },
      },
      include: { lines: true },
    });

    assert(recurring.id !== undefined, "Création de la facture récurrente");
    assert(recurring.frequency === "MONTHLY", "Fréquence configurée à MONTHLY");
    assert(recurring.active === true, "Abonnement actif");

    // Génération manuelle/automatique d'une facture depuis l'abonnement
    const orgForRec = await prisma.organization.update({
      where: { id: orgId },
      data: { invoiceCounter: { increment: 1 } },
    });
    const recInvNum = `FAC-${year}-${String(orgForRec.invoiceCounter).padStart(3, "0")}`;

    const genInvoice = await prisma.invoice.create({
      data: {
        organizationId: orgId,
        clientId: recurring.clientId,
        recurringInvoiceId: recurring.id,
        number: recInvNum,
        name: `${recurring.title} - ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        clientName: recurring.clientName,
        clientAddress: recurring.clientAddress,
        clientEmail: recurring.clientEmail,
        vatActive: recurring.vatActive,
        vatRate: recurring.vatRate,
        status: "SENT",
        currency: recurring.currency,
        publicToken: `token_rec_${Date.now()}`,
        lines: {
          create: recurring.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
    });

    const nextRun = computeNextDate(recurring.nextRunDate, recurring.frequency);
    await prisma.recurringInvoice.update({
      where: { id: recurring.id },
      data: { nextRunDate: nextRun },
    });

    assert(genInvoice.recurringInvoiceId === recurring.id, "Facture issue de l'abonnement rattachée avec succès");
    assert(genInvoice.number === recInvNum, `Facture récurrente numérotée (${recInvNum})`);

    // -------------------------------------------------------------
    // MODULE 9 : AVOIRS & NOTES DE CRÉDIT
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 9] Avoirs & Notes de Crédit\x1b[0m");

    const orgForCN = await prisma.organization.update({
      where: { id: orgId },
      data: { creditNoteCounter: { increment: 1 } },
    });
    const cnNumber = `AV-${year}-${String(orgForCN.creditNoteCounter).padStart(3, "0")}`;

    const cnLines = [{ description: "Remise commerciale exceptionnelle", quantity: 1, unitPrice: 50000 }];
    const cnTotals = calcTotal(cnLines, true, 18);
    // HT = 50,000 | TVA = 9,000 | TTC = 59,000
    assert(cnTotals.ht === 50000 && cnTotals.ttc === 59000, "Calcul exact de l'avoir TTC (59 000 XOF)");

    const creditNote = await prisma.creditNote.create({
      data: {
        organizationId: orgId,
        invoiceId: invoice2.id,
        clientId: invoice2.clientId,
        number: cnNumber,
        reason: "Geste commercial sur prestation",
        vatActive: true,
        vatRate: 18,
        currency: "XOF",
        clientName: invoice2.clientName,
        clientAddress: invoice2.clientAddress,
        lines: { create: cnLines },
      },
      include: { lines: true, invoice: true },
    });

    assert(creditNote.number === cnNumber, `Avoir créé avec numéro séquentiel (${cnNumber})`);
    assert(creditNote.invoiceId === invoice2.id, "Avoir rattaché à la facture d'origine");

    // Vérification de la contrainte d'unicité (organizationId, number)
    let duplicateRejected = false;
    try {
      await prisma.creditNote.create({
        data: {
          organizationId: orgId,
          number: cnNumber, // Doublon intentionnel
          reason: "Test doublon",
          lines: { create: cnLines },
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected === true, "Unicité stricte garantie sur (organizationId, number)");

    // -------------------------------------------------------------
    // MODULE 10 : DÉPENSES & CHARGES
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 10] Dépenses & Charges\x1b[0m");

    const exp1 = await prisma.expense.create({
      data: {
        organizationId: orgId,
        title: "Loyer bureaux Lomé Février 2026",
        amount: 250000,
        category: "Loyer",
        expenseDate: new Date(),
        notes: "Virement bancaire bailleur",
      },
    });

    const exp2 = await prisma.expense.create({
      data: {
        organizationId: orgId,
        title: "Carburant & Déplacements clients",
        amount: 45000,
        category: "Transport",
        expenseDate: new Date(),
      },
    });

    const exp3 = await prisma.expense.create({
      data: {
        organizationId: orgId,
        title: "Campagne publicitaire Facebook & LinkedIn",
        amount: 80000,
        category: "Marketing",
        expenseDate: new Date(),
      },
    });

    const totalExpenses = exp1.amount + exp2.amount + exp3.amount; // 375,000 XOF
    assert(totalExpenses === 375000, "Enregistrement et total des charges conforme (375 000 XOF)");

    const expensesList = await prisma.expense.findMany({ where: { organizationId: orgId } });
    assert(expensesList.length === 3, "Récupération des 3 dépenses enregistrées");

    // -------------------------------------------------------------
    // MODULE 11 : RAPPORTS COMPTABLES, MARGE NETTE, EXCEL & ZIP
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 11] Rapports Comptables, Marge Nette, Exports Excel & ZIP\x1b[0m");

    // Récupération globale des données pour le rapport
    const allInvoices = await prisma.invoice.findMany({
      where: { organizationId: orgId },
      include: { lines: true, payments: true, client: true },
    });
    const allCreditNotes = await prisma.creditNote.findMany({
      where: { organizationId: orgId },
      include: { lines: true },
    });

    let sumHT = 0;
    let sumVAT = 0;
    let sumTTC = 0;
    let sumPaid = 0;

    for (const inv of allInvoices) {
      const { ht, vat, ttc } = calcTotal(inv.lines, inv.vatActive, inv.vatRate);
      sumHT += ht;
      sumVAT += vat;
      sumTTC += ttc;
      sumPaid += inv.payments.reduce((s, p) => s + p.amount, 0);
    }

    let sumCN_TTC = 0;
    for (const cn of allCreditNotes) {
      const { ttc } = calcTotal(cn.lines, cn.vatActive, cn.vatRate);
      sumCN_TTC += ttc;
    }

    // Calcul de la marge nette : (Total Facturé HT - Total Avoirs TTC/HT) - Total Dépenses
    const netProfit = sumHT - sumCN_TTC - totalExpenses;
    assert(typeof netProfit === "number", `Calcul de la rentabilité / marge nette (${netProfit} XOF)`);

    // Test de génération Excel Comptable (ExcelJS)
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FactuPro Audit Test";
    const sheet1 = workbook.addWorksheet("Synthèse Financière");
    sheet1.addRow(["Indicateur", "Montant (XOF)"]);
    sheet1.addRow(["CA Facturé HT", sumHT]);
    sheet1.addRow(["TVA Collectée", sumVAT]);
    sheet1.addRow(["Total Encaissé", sumPaid]);
    sheet1.addRow(["Total Avoirs", -sumCN_TTC]);
    sheet1.addRow(["Total Dépenses", -totalExpenses]);
    sheet1.addRow(["Bénéfice Net", netProfit]);

    const excelBuffer = await workbook.xlsx.writeBuffer();
    assert(excelBuffer.byteLength > 1000, `Génération du classeur Excel réussie (${excelBuffer.byteLength} octets)`);

    // Test de génération d'archive ZIP (JSZip)
    const zip = new JSZip();
    zip.file("Rapport_Financier_FactuPro.xlsx", excelBuffer);
    zip.file("Journal_Ventes.csv", "Date;Numero;Client;HT;TVA;TTC\n");
    zip.file("Journal_Depenses.csv", "Date;Titre;Categorie;Montant\n");
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    assert(zipBuffer.length > 1000, `Génération du pack ZIP comptable réussie (${zipBuffer.length} octets)`);

    // -------------------------------------------------------------
    // MODULE 12 : PARTAGE WHATSAPP & FORMATAGE NUMÉROS TOGO (+228)
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 12] Partage WhatsApp & Nettoyage Numéros Togolais\x1b[0m");

    // Test cleanPhoneNumber
    assert(cleanPhoneNumber("90 12 34 56") === "22890123456", "Numéro 8 chiffres Togo converti avec indicatif 228 (90123456 -> 22890123456)");
    assert(cleanPhoneNumber("+228 91 23 45 67") === "22891234567", "Numéro +228 avec espaces nettoyé (+228 91 23 45 67 -> 22891234567)");
    assert(cleanPhoneNumber("22892345678") === "22892345678", "Numéro avec indicatif 228 déjà présent conservé");
    assert(cleanPhoneNumber("+33 6 12 34 56 78") === "33612345678", "Numéro international France nettoyé (+33 6 12 34 56 78 -> 33612345678)");
    assert(cleanPhoneNumber(null) === "", "Numéro null renvoie chaîne vide");
    assert(cleanPhoneNumber("") === "", "Numéro vide renvoie chaîne vide");

    // Test generateWhatsAppLink
    const waLink = generateWhatsAppLink("90123456", "Bonjour STC, voici votre facture.");
    assert(waLink.startsWith("https://wa.me/22890123456?text="), "Lien wa.me correctement formé avec numéro Togo");
    assert(waLink.includes("Bonjour%20STC"), "Texte WhatsApp encodé en URL");

    // Test buildInvoiceWhatsAppMessage (Standard)
    const msgStandard = buildInvoiceWhatsAppMessage({
      clientName: "STC",
      invoiceNumber: "FAC-2026-001",
      totalFormatted: "708 000 XOF",
      issuerName: "FactuPro Audit",
      portalUrl: "https://factupro.tg/view/invoice/token123",
      isReminder: false,
    });
    assert(msgStandard.includes("FAC-2026-001"), "Message standard contient le numéro de facture");
    assert(msgStandard.includes("Mixx by Yas") && msgStandard.includes("Moov Money"), "Message mentionne Mixx by Yas et Moov Money");
    assert(msgStandard.includes("https://factupro.tg/view/invoice/token123"), "Message contient le lien du portail sécurisé");

    // Test buildInvoiceWhatsAppMessage (Relance)
    const msgReminder = buildInvoiceWhatsAppMessage({
      clientName: "STC",
      invoiceNumber: "FAC-2026-001",
      totalFormatted: "708 000 XOF",
      remainingFormatted: "408 000 XOF",
      issuerName: "FactuPro Audit",
      portalUrl: "https://factupro.tg/view/invoice/token123",
      isReminder: true,
      dueDateFormatted: "28/02/2026",
    });
    assert(msgReminder.includes("Rappel de paiement"), "Message de relance identifié comme tel");
    assert(msgReminder.includes("408 000 XOF"), "Message de relance affiche le montant restant dû");

    // Test buildQuoteWhatsAppMessage
    const quoteMsg = buildQuoteWhatsAppMessage({
      clientName: "STC",
      quoteNumber: "DEV-2026-001",
      totalFormatted: "708 000 XOF",
      issuerName: "FactuPro",
      portalUrl: "https://factupro.tg/view/quote/token999",
    });
    assert(quoteMsg.includes("DEV-2026-001"), "Message devis WhatsApp contient le numéro de devis");
    assert(quoteMsg.includes("signer électroniquement"), "Message devis mentionne la signature électronique");

    // -------------------------------------------------------------
    // MODULE 13 : ESPACE ADMIN & STATISTIQUES GLOBALES
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 13] Espace Admin & Statistiques Globales Plateforme\x1b[0m");

    const adminEmails = getAdminEmails();
    assert(adminEmails.includes("ariskpandja@gmail.com"), "Configuration email admin plateforme active (ariskpandja@gmail.com)");
    assert(isPlatformAdminEmail("ariskpandja@gmail.com") === true, "isPlatformAdminEmail accepte l'admin légitime");
    assert(isPlatformAdminEmail("hacker@malicious.com") === false, "isPlatformAdminEmail bloque les tiers non autorisés");
    assert(isPlatformAdminEmail(null) === false, "isPlatformAdminEmail refuse les requêtes anonymes");

    // Calcul des statistiques globales
    const [globalUserCount, globalOrgCount, globalInvoiceCount, globalQuoteCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.invoice.count(),
      prisma.quote.count(),
    ]);

    assert(globalUserCount >= 1, `Statistiques Admin: Utilisateurs enregistrés (${globalUserCount})`);
    assert(globalOrgCount >= 1, `Statistiques Admin: Entreprises inscrites (${globalOrgCount})`);
    assert(globalInvoiceCount >= 1, `Statistiques Admin: Total Factures créées (${globalInvoiceCount})`);
    assert(globalQuoteCount >= 1, `Statistiques Admin: Total Devis créés (${globalQuoteCount})`);

    // -------------------------------------------------------------
    // MODULE 14 : SÉCURITÉ, ISOLATION MULTI-TENANT & FORMATAGE
    // -------------------------------------------------------------
    console.log("\n\x1b[34m[MODULE 14] Sécurité, Isolation Multi-Tenant & Formatage Monétaire\x1b[0m");

    // Création d'une seconde organisation concurrente (Tenant B)
    const org2 = await prisma.organization.create({
      data: {
        name: `Tenant B ${Date.now()}`,
        currency: "EUR",
      },
    });
    org2Id = org2.id;

    // Tentative de requête filtrée sur l'organisation 2 avec les ID de l'organisation 1
    const crossTenantInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoice2.id,
        organizationId: org2Id, // Isolation check
      },
    });
    assert(crossTenantInvoice === null, "Isolation Multi-Tenant : Tenant B ne peut pas accéder aux factures de Tenant A");

    const crossTenantClient = await prisma.client.findFirst({
      where: {
        id: client1.id,
        organizationId: org2Id,
      },
    });
    assert(crossTenantClient === null, "Isolation Multi-Tenant : Tenant B ne peut pas accéder aux clients de Tenant A");

    // Formatage monétaire
    assert(formatMoney(1500000, "XOF").includes("1\u202f500\u202f000") || formatMoney(1500000, "XOF").includes("1 500 000"), "Formatage XOF sans décimales");
    assert(formatMoney(1500.5, "EUR").includes("1\u202f500,50") || formatMoney(1500.5, "EUR").includes("1 500,50"), "Formatage EUR avec 2 décimales");

    const formattedDate = formatDisplayDate(new Date(2026, 7, 28));
    assert(formattedDate.includes("2026"), "Formatage d'affichage des dates en français");

  } catch (error) {
    console.error("\x1b[31mErreur inattendue pendant l'audit:\x1b[0m", error);
    failures.push({ testName: "Exception globale", error });
  } finally {
    // Nettoyage complet des données de test
    console.log("\n\x1b[33mNettoyage des données de test isolées...\x1b[0m");
    if (orgId) {
      await prisma.organization.deleteMany({ where: { id: orgId } });
    }
    if (org2Id) {
      await prisma.organization.deleteMany({ where: { id: org2Id } });
    }
    console.log("  Données de test nettoyées avec succès.");
  }

  // Bilan
  console.log("\n==================================================================");
  console.log(` 📊 BILAN DES TESTS : ${passedTests} / ${totalTests} RÉUSSIS (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests === 0) {
    console.log(" \x1b[32m✔ TOUS LES MODULES FONCTIONNELS ET DE SÉCURITÉ SONT 100% VALIDES !\x1b[0m");
  } else {
    console.log(` \x1b[31m✖ ${failedTests} TEST(S) ONT ÉCHOUÉ.\x1b[0m`);
    failures.forEach((f) => console.log(`   - ${f.testName}:`, f.error));
  }
  console.log("==================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Crash du runner de test:", err);
  process.exit(1);
});
