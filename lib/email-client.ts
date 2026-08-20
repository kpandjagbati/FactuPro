export function openMailto(to: string, subject: string, body: string) {
  const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

export function handleEmailResult(
  result:
    | { mode: "resend"; to: string }
    | { mode: "mailto"; to: string; subject: string; body: string }
    | { mode: "error"; message: string },
  docLabel: "facture" | "devis" | "relance",
) {
  if (result.mode === "error") {
    alert(result.message);
    return "error" as const;
  }

  const sentLabel =
    docLabel === "facture"
      ? "Facture"
      : docLabel === "devis"
        ? "Devis"
        : "Relance";

  if (result.mode === "resend") {
    alert(`${sentLabel} envoyé(e) à ${result.to}`);
    return "resend" as const;
  }

  openMailto(result.to, result.subject, result.body);
  alert(
    `Envoi automatique non configuré (Resend).\nOuverture de votre messagerie pour envoyer à ${result.to}.`,
  );
  return "mailto" as const;
}
