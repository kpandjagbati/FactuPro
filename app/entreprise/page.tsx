"use client";

import {
  getCompanyProfile,
  updateCompanyProfile,
} from "@/app/actions";
import { uploadCompanyLogo } from "@/app/actions-v2";
import Wrapper from "@/app/components/Wrapper";
import type { CompanyProfileInput } from "@/type";
import { Save, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const emptyForm: CompanyProfileInput = {
  name: "",
  address: "",
  email: "",
  phone: "",
  taxId: "",
  iban: "",
  logoUrl: "",
};

export default function EntreprisePage() {
  const [form, setForm] = useState<CompanyProfileInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCompanyProfile();
        setForm({
          name: profile.name || "",
          address: profile.address || "",
          email: profile.email || "",
          phone: profile.phone || "",
          taxId: profile.taxId || "",
          iban: profile.iban || "",
          logoUrl: profile.logoUrl || "",
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateCompanyProfile(form);
      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("logo", file);
      const logoUrl = await uploadCompanyLogo(data);
      setForm((prev) => ({ ...prev, logoUrl }));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Wrapper>
      <div className="mx-auto flex max-w-2xl flex-col space-y-4">
        <h1 className="text-lg font-bold">Entreprise</h1>
        <p className="text-base-content/70">
          Ces informations préremplissent l&apos;émetteur de vos factures et
          devis.
        </p>

        {loading ? (
          <span className="loading loading-spinner loading-md text-info" />
        ) : (
          <div className="space-y-3 rounded-xl bg-base-200 p-5">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-base-100">
                {form.logoUrl ? (
                  <Image
                    src={form.logoUrl.split("?")[0]}
                    alt="Logo entreprise"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs opacity-50">Logo</span>
                )}
              </div>
              <label className="btn btn-sm btn-info">
                {uploading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <Upload className="w-4" />
                    Importer un logo
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) =>
                    handleLogoUpload(e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">
                Nom de l&apos;entreprise
              </span>
              <input
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">Adresse</span>
              <textarea
                className="textarea textarea-bordered w-full"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Email</span>
                <input
                  className="input input-bordered w-full"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Téléphone</span>
                <input
                  className="input input-bordered w-full"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            </div>

            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">
                IFU / NIF / RCCM
              </span>
              <input
                className="input input-bordered w-full"
                value={form.taxId || ""}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">IBAN / Compte</span>
              <input
                className="input input-bordered w-full"
                value={form.iban || ""}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                className="btn btn-info"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    Enregistrer
                    <Save className="ml-2 w-4" />
                  </>
                )}
              </button>
              {saved && (
                <span className="text-sm text-success">Profil enregistré.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
