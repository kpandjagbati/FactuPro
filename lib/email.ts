import { Resend } from "resend";
import { formatMoney } from "@/lib/format";

export type DocumentEmailKind = "invoice" | "quote";

type SendDocumentEmailParams = {
  kind: DocumentEmailKind;
  to: string;
  number: string;
  name: string;
  companyName: string;
  totalTTC: number;
  currency: string;
  fromEmail?: string;
};

export type EmailSendResult =
  | { mode: "resend"; to: string }
  | {
      mode: "mailto";
      to: string;
      subject: string;
      body: string;
    };

function buildCopy(params: SendDocumentEmailParams) {
  const label = params.kind === "invoice" ? "Facture" : "Devis";
  const subject = `${label} ${params.number} — ${params.companyName}`;
  const total = formatMoney(params.totalTTC, params.currency);
  const body = [
    "Bonjour,",
    "",
    `Veuillez trouver le récapitulatif du ${label.toLowerCase()} ${params.number} (${params.name}) émis par ${params.companyName}.`,
    "",
    `Total TTC : ${total}`,
    "",
    "Cordialement,",
    params.companyName,
    "via FactuPro",
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>${label} ${params.number}</h2>
      <p>Bonjour,</p>
      <p>
        Veuillez trouver ci-dessous le récapitulatif du ${label.toLowerCase()}
        <strong>${params.name}</strong> émis par <strong>${params.companyName}</strong>.
      </p>
      <p style="font-size: 18px;">
        <strong>Total TTC : ${total}</strong>
      </p>
      <p>Cordialement,<br/>${params.companyName}<br/><em>via FactuPro</em></p>
    </div>
  `;

  return { label, subject, body, html };
}

/** Envoi via Resend si clé présente, sinon contenu prêt pour mailto. */
export async function sendDocumentEmail(
  params: SendDocumentEmailParams,
): Promise<EmailSendResult> {
  const { subject, body, html } = buildCopy(params);
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { mode: "mailto", to: params.to, subject, body };
  }

  const resend = new Resend(apiKey);
  const from =
    params.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "FactuPro <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { mode: "resend", to: params.to };
}

/** @deprecated use sendDocumentEmail */
export async function sendInvoiceEmail(
  params: Omit<SendDocumentEmailParams, "kind" | "number" | "name"> & {
    invoiceNumber: string;
    invoiceName: string;
  },
) {
  return sendDocumentEmail({
    kind: "invoice",
    to: params.to,
    number: params.invoiceNumber,
    name: params.invoiceName,
    companyName: params.companyName,
    totalTTC: params.totalTTC,
    currency: params.currency,
    fromEmail: params.fromEmail,
  });
}
