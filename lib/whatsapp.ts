/**
 * Utilitaires pour le partage et la relance directe par WhatsApp
 */

export function cleanPhoneNumber(phone?: string | null, defaultCountryCode = "228"): string {
  if (!phone) return "";
  // Retirer tous les caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 8) {
    // Numéro togolais à 8 chiffres (ex: 90123456)
    cleaned = `${defaultCountryCode}${cleaned}`;
  }

  return cleaned;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanedPhone = cleanPhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  if (cleanedPhone) {
    return `https://wa.me/${cleanedPhone}?text=${encodedMsg}`;
  }
  return `https://wa.me/?text=${encodedMsg}`;
}

export function buildInvoiceWhatsAppMessage({
  clientName,
  invoiceNumber,
  totalFormatted,
  issuerName,
  portalUrl,
  isReminder = false,
  dueDateFormatted,
  remainingFormatted,
}: {
  clientName: string;
  invoiceNumber: string;
  totalFormatted: string;
  issuerName?: string;
  portalUrl?: string;
  isReminder?: boolean;
  dueDateFormatted?: string;
  remainingFormatted?: string;
}): string {
  if (isReminder) {
    return `Bonjour ${clientName || ""},

⚠️ *Rappel de paiement - Facture ${invoiceNumber}*
Émetteur : ${issuerName || "Votre prestataire"}
${dueDateFormatted ? `Date d'échéance : ${dueDateFormatted}\n` : ""}Montant restant dû : *${remainingFormatted || totalFormatted}*

Vous pouvez consulter votre facture et effectuer votre règlement par *Mixx by Yas* ou *Moov Money* via ce lien sécurisé :
${portalUrl || ""}

Merci de votre diligence.`;
  }

  return `Bonjour ${clientName || ""},

Voici votre facture *${invoiceNumber}* d'un montant de *${totalFormatted}* émise par *${issuerName || "FactuPro"}*.

Vous pouvez la consulter, télécharger votre PDF officiel et régler par *Mixx by Yas* ou *Moov Money* via ce lien sécurisé :
${portalUrl || ""}

Merci pour votre confiance !`;
}

export function buildQuoteWhatsAppMessage({
  clientName,
  quoteNumber,
  totalFormatted,
  issuerName,
  portalUrl,
}: {
  clientName: string;
  quoteNumber: string;
  totalFormatted: string;
  issuerName?: string;
  portalUrl?: string;
}): string {
  return `Bonjour ${clientName || ""},

Voici votre devis *${quoteNumber}* d'un montant de *${totalFormatted}* proposé par *${issuerName || "FactuPro"}*.

Vous pouvez consulter les détails et le *signer électroniquement en ligne* directement via ce lien :
${portalUrl || ""}

Restant à votre entière disposition pour tout échange.`;
}
