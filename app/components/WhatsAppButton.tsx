"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import {
  buildInvoiceWhatsAppMessage,
  buildQuoteWhatsAppMessage,
  cleanPhoneNumber,
  generateWhatsAppLink,
} from "@/lib/whatsapp";

interface Props {
  type: "invoice" | "quote" | "reminder";
  docNumber: string;
  clientName: string;
  clientPhone?: string | null;
  totalFormatted: string;
  issuerName?: string;
  portalUrl: string;
  dueDateFormatted?: string;
  remainingFormatted?: string;
  className?: string;
  buttonText?: string;
  compact?: boolean;
}

export default function WhatsAppButton({
  type,
  docNumber,
  clientName,
  clientPhone: initialPhone,
  totalFormatted,
  issuerName,
  portalUrl,
  dueDateFormatted,
  remainingFormatted,
  className = "",
  buttonText,
  compact = false,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState(initialPhone || "");
  const [message, setMessage] = useState("");

  const prepareMessage = () => {
    let msg = "";
    if (type === "quote") {
      msg = buildQuoteWhatsAppMessage({
        clientName,
        quoteNumber: docNumber,
        totalFormatted,
        issuerName,
        portalUrl,
      });
    } else {
      msg = buildInvoiceWhatsAppMessage({
        clientName,
        invoiceNumber: docNumber,
        totalFormatted,
        issuerName,
        portalUrl,
        isReminder: type === "reminder",
        dueDateFormatted,
        remainingFormatted,
      });
    }
    setMessage(msg);
    setModalOpen(true);
  };

  const handleSend = () => {
    const url = generateWhatsAppLink(phone, message);
    window.open(url, "_blank");
    setModalOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={prepareMessage}
        className={`btn btn-sm ${
          type === "reminder" ? "btn-warning" : "bg-[#25D366] hover:bg-[#1EBE5D] text-white border-none"
        } gap-1.5 shadow-sm ${className}`}
        title="Partager directement par WhatsApp"
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        {!compact && (
          <span>
            {buttonText ||
              (type === "reminder"
                ? "Relance WhatsApp"
                : "Envoyer sur WhatsApp")}
          </span>
        )}
      </button>

      {modalOpen && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between pb-3 border-b border-base-300">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base">
                  {type === "reminder"
                    ? "Relance WhatsApp"
                    : `Partage WhatsApp • ${docNumber}`}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">
                    Numéro WhatsApp du destinataire (Togo: +228...)
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +228 90 12 34 56 ou 90123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">
                    Message pré-rempli
                  </span>
                </label>
                <textarea
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="textarea textarea-bordered w-full text-xs font-mono"
                />
              </div>

              <div className="rounded-lg bg-base-200 p-3 text-[11px] text-base-content/70">
                💡 Le client recevra directement ce message avec son lien d&apos;accès sécurisé vers le portail client pour consulter et régler via <strong>Mixx by Yas</strong> ou <strong>Moov Money</strong>.
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-sm btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  className="btn btn-sm bg-[#25D366] hover:bg-[#1EBE5D] text-white border-none gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  Ouvrir WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
