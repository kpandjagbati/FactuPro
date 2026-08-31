                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "use client";

import {
  getCompanyProfile,
  updateCompanyProfile,
} from "@/app/actions";
import { uploadCompanyLogo } from "@/app/actions-v2";
import Wrapper from "@/app/components/Wrapper";
import type { CompanyProfileInput } from "@/type";
import { Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm: CompanyProfileInput = {
  name: "",
  address: "",
  email: "",
  phone: "",
  taxId: "",
  iban: "",
  logoUrl: "",
  primaryColor: "#0284c7",
  footerText: "",
  paymentTerms: "",
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
          primaryColor: profile.primaryColor || "#0284c7",
          footerText: profile.footerText || "",
          paymentTerms: profile.paymentTerms || "",
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
      const result = await uploadCompanyLogo(data);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setForm((prev) => ({ ...prev, logoUrl: result.logoUrl }));
    } catch (error) {
      console.error(error);
      alert("Upload impossible. Réessayez avec une image plus légère (max 1 Mo).");
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Logo entreprise"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
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

            <div className="grid gap-3 md:grid-cols-2">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">
                  Couleur principale des PDF / Marque
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-16 cursor-pointer rounded-lg border border-base-300 bg-base-100 p-1"
                    value={form.primaryColor || "#0284c7"}
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono text-sm uppercase"
                    value={form.primaryColor || "#0284c7"}
                    placeholder="#0284c7"
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                  />
                </div>
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">
                  Raccourcis couleurs
                </span>
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { label: "Bleu Océan", color: "#0284c7" },
                    { label: "Indigo", color: "#4f46e5" },
                    { label: "Émeraude", color: "#059669" },
                    { label: "Anthracite", color: "#0f172a" },
                    { label: "Bordeaux", color: "#991b1b" },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, primaryColor: preset.color })
                      }
                      className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: preset.color,
                        borderColor:
                          form.primaryColor === preset.color
                            ? "#ffffff"
                            : "transparent",
                        outline:
                          form.primaryColor === preset.color
                            ? `2px solid ${preset.color}`
                            : "none",
                      }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </label>
            </div>

            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">
                Pied de page personnalisé des documents (PDF)
              </span>
              <input
                className="input input-bordered w-full"
                placeholder="Ex. SARL au capital de 1 000 000 FCFA — Registre du Commerce de Lomé N° 123456"
                value={form.footerText || ""}
                onChange={(e) =>
                  setForm({ ...form, footerText: e.target.value })
                }
              />
              <span className="label-text-alt mt-1 text-base-content/60">
                Ce texte apparaîtra en bas de chaque page de vos factures, devis, avoirs et quittances.
              </span>
            </label>

            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">
                Conditions de paiement (PDF)
              </span>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Ex. Paiement à 30 jours à compter de la date de facture."
                value={form.paymentTerms || ""}
                onChange={(e) =>
                  setForm({ ...form, paymentTerms: e.target.value })
                }
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
