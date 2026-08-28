"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, CheckCircle2, FileText, Truck } from "lucide-react";
import Wrapper from "@/app/components/Wrapper";
import { generateDeliveryNote, getDeliveryNoteData } from "@/app/actions-delivery";
import type { Invoice } from "@/type";

const DeliveryNotePDF = dynamic(
  () => import("@/app/components/DeliveryNotePDF"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-info" />
      </div>
    ),
  },
);

export default function DeliveryNotePage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Generate or retrieve BL number
      await generateDeliveryNote(params.invoiceId);
      const data = await getDeliveryNoteData(params.invoiceId);
      setInvoice(data as unknown as Invoice);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.invoiceId) {
      loadData();
    }
  }, [params.invoiceId]);

  if (loading || !invoice) {
    return (
      <Wrapper>
        <div className="flex h-64 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-info" />
        </div>
      </Wrapper>
    );
  }

  const company = (invoice as any).organization?.companyProfile || null;

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/invoice/${invoice.id}`}
              className="btn btn-circle btn-sm btn-ghost"
              title="Retour à la facture"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-info gap-1 text-xs">
                  <Truck className="h-3.5 w-3.5" />
                  Bon de Livraison
                </span>
                <span className="font-mono text-xs font-bold">
                  {invoice.deliveryNumber}
                </span>
              </div>
              <h1 className="text-xl font-bold mt-1">
                {invoice.name}
              </h1>
            </div>
          </div>

          <Link
            href={`/invoice/${invoice.id}`}
            className="btn btn-sm btn-outline gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Voir la facture ({invoice.number})
          </Link>
        </div>

        {/* Aperçu PDF du Bon de livraison */}
        <DeliveryNotePDF invoice={invoice} company={company} />
      </div>
    </Wrapper>
  );
}
