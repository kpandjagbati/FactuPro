import { Resend } from "resend";
import { formatMoney } from "@/lib/format";

type SendInvoiceEmailParams = {
  to: string;
  invoiceNumber: string;
  invoiceName: string;
  companyName: string;
  totalTTC: number;
  currency: string;
  fromEmail?: string;
};

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  invoiceName,
  companyName,
  totalTTC,
  currency,
  fromEmail,
}: SendInvoiceEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY manquant. Ajoute-la dans .env.local (https://resend.com)",
    );
  }

  const resend = new Resend(apiKey);
  const from =
    fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "FactuPro <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Facture ${invoiceNumber} — ${companyName}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Facture ${invoiceNumber}</h2>
        <p>Bonjour,</p>
        <p>
          Veuillez trouver ci-dessous le récapitulatif de la facture
          <strong>${invoiceName}</strong> émise par <strong>${companyName}</strong>.
        </p>
        <p style="font-size: 18px;">
          <strong>Total TTC : ${formatMoney(totalTTC, currency)}</strong>
        </p>
        <p>Cordialement,<br/>${companyName}<br/><em>via FactuPro</em></p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
