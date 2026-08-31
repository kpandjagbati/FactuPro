import QRCode from "qrcode";

/**
 * Génère un QR Code sous forme de Data URL (PNG base64)
 * Parfait pour l'intégration dans html2canvas / jsPDF et les balises <img>.
 */
export async function generateQrCodeDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  },
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width ?? 160,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.darkColor ?? "#0f172a",
        light: options?.lightColor ?? "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Erreur lors de la génération du QR Code:", err);
    return "";
  }
}
