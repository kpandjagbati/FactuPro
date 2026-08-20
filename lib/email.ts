import { Resend } from "resend";
import { formatMoney } from "@/lib/format";

export type DocumentEmailKind = "invoice" | "quote" | "reminder";

type SendDocumentEmailParams = {
  kind: DocumentEmailKind;
  to: string;
  number: string;
  name: string;
  companyName: string;
  totalTTC: number;
  currency: string;
  fromEmail?: string;
  dueDate?: Date | string | null;
};

export type EmailSendResult =
  | { mode: "resend"; to: string }
  | { mode: "mailto"; to: string; subject: string; body: string }
  | { mode: "error"; message: string };

function buildCopy(params: SendDocumentEmailParams) {
  const total = formatMoney(params.totalTTC, params.currency);
  const dueLabel =
    params.dueDate && params.kind === "reminder"
      ? new Date(params.dueDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

  if (params.kind === "reminder") {
    const subject = `Relance — Facture ${params.number} — ${params.companyName}`;
    const body = [
      "Bonjour,",
      "",
      `Sauf erreur de notre part, la facture ${params.number} (${params.name}) d'un montant de ${total} reste impayée.`,
      dueLabel ? `Date d'échéance : ${dueLabel}.` : "",
      "",
      "Merci de procéder au règlement dans les meilleurs délais.",
      "",
      "Cordialement,",
      params.companyName,
      "via FactuPro",
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2 style="color:#ea580c;">Relance de paiement</h2>
        <p>Bonjour,</p>
        <p>
          Sauf erreur de notre part, la facture <strong>${params.number}</strong>
          (<strong>${params.name}</strong>) d'un montant de
          <strong>${total}</strong> reste impayée.
        </p>
        ${dueLabel ? `<p>Date d'échéance : <strong>${dueLabel}</strong>.</p>` : ""}
        <p>Merci de procéder au règlement dans les meilleurs délais.</p>
        <p>Cordialement,<br/>${params.companyName}<br/><em>via FactuPro</em></p>
      </div>
    `;

    return { label: "Relance", subject, body, html };
  }

  const label = params.kind === "invoice" ? "Facture" : "Devis";
  const subject = `${label} ${params.number} — ${params.companyName}`;
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

function friendlyResendError(raw: string, to: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("only send testing emails") ||
    lower.includes("verify a domain") ||
    lower.includes("own email")
  ) {
    return (
      `Resend (mode test) n'autorise l'envoi qu'à votre email de compte.\n` +
      `Destinataire : ${to}\n\n` +
      `Solution : envoyez à votre email Resend, ou vérifiez un domaine sur resend.com.`
    );
  }
  if (lower.includes("api key") || lower.includes("unauthorized") || lower.includes("invalid")) {
    return `Clé Resend invalide ou refusée. Vérifiez RESEND_API_KEY sur Vercel.\n(${raw})`;
  }
  return `Échec d'envoi Resend : ${raw}`;
}

/** Envoi via Resend si clé présente, sinon contenu prêt pour mailto. Ne throw pas. */
export async function sendDocumentEmail(
  params: SendDocumentEmailParams,
): Promise<EmailSendResult> {
  const { subject, body, html } = buildCopy(params);
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { mode: "mailto", to: params.to, subject, body };
  }

  try {
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
      return {
        mode: "error",
        message: friendlyResendError(error.message, params.to),
      };
    }

    return { mode: "resend", to: params.to };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Erreur inconnue";
    return { mode: "error", message: friendlyResendError(raw, params.to) };
  }
}
