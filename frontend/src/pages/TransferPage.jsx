import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getComptes, virement } from "../api";
import { Skeleton } from "../components/Skeleton";
import { virementSchema } from "../validation";
import styles from "./TransferPage.module.css";

export default function TransferPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(virementSchema), defaultValues: { destinataireId: "", montant: "", description: "" } });

  const destinataireId = watch("destinataireId");
  const montant = watch("montant");

  useEffect(() => {
    getComptes()
      .then((d) => {
        if (d.succes) setComptes(d.donnees.filter((c) => c.id !== user.id));
      })
      .finally(() => setLoadingList(false));
  }, [user.id]);

  async function onSubmit(data) {
    try {
      const val = parseFloat(data.montant);
      const res = await virement(user.id, data.destinataireId, val, data.description?.trim() || undefined);
      if (res.succes) {
        updateUser(res.donnees.source);
        showToast(res.message, "success");
        reset();
      } else {
        showToast(res.message, "error");
      }
    } catch {
      showToast("Impossible de contacter le serveur.", "error");
    }
  }

  const dest = useMemo(() => comptes.find((c) => c.id === destinataireId), [comptes, destinataireId]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <button className="btn-ghost" style={{ fontSize: "13px", padding: "6px 12px" }} onClick={() => navigate("/")}>
            ← Retour
          </button>
          <h2 className={styles.pageTitle}>Effectuer un virement</h2>
        </div>

        <div className={styles.grid}>
          <div className={`card ${styles.formCard}`}>
            <h3 className={styles.cardTitle}>Détails du virement</h3>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.section}>
                <p className={styles.sectionLabel}>De votre compte</p>
                <div className={styles.accountBox}>
                  <div className={styles.accountAvatar}>
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </div>
                  <div>
                    <p className={styles.accountName}>{user.prenom} {user.nom}</p>
                    <p className={styles.accountSolde}>Solde : {user.solde}</p>
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label>Destinataire</label>
                {loadingList ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} height={38} radius={8} />
                    ))}
                  </div>
                ) : comptes.length === 0 ? (
                  <p className={styles.noAccounts}>Aucun autre compte disponible.</p>
                ) : (
                  <select {...register("destinataireId")}>
                    <option value="">-- Sélectionner un compte --</option>
                    {comptes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom}{c.email ? ` — ${c.email}` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {errors.destinataireId && <p className="error-msg">{errors.destinataireId.message}</p>}
              </div>

              <div className={styles.field}>
                <label>Montant (FCFA)</label>
                <input type="number" min="1" step="any" {...register("montant")} placeholder="Ex : 10000" />
                {errors.montant && <p className="error-msg">{errors.montant.message}</p>}
              </div>

              <div className={styles.field}>
                <label>Motif <span className={styles.opt}>(optionnel)</span></label>
                <input {...register("description")} placeholder="Ex : Remboursement loyer" />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "13px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Traitement..." : "Confirmer le virement"}
              </button>
            </form>
          </div>

          <div className={styles.summaryCol}>
            <div className={`card ${styles.summaryCard}`}>
              <h3 className={styles.cardTitle}>Résumé</h3>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Émetteur</span>
                  <span className={styles.summaryVal}>{user.prenom} {user.nom}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Destinataire</span>
                  <span className={styles.summaryVal}>
                    {dest ? `${dest.prenom} ${dest.nom}` : "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Montant</span>
                  <span className={`${styles.summaryVal} ${styles.highlight}`}>
                    {montant ? `${parseFloat(montant).toFixed(2)} FCFA` : "—"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Solde après</span>
                  <span className={styles.summaryVal}>
                    {montant && parseFloat(user.solde)
                      ? `${Math.max(0, parseFloat(user.solde) - parseFloat(montant)).toFixed(2)} FCFA`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`card ${styles.infoCard}`}>
              <p className={styles.infoTitle}>ℹ Information</p>
              <p className={styles.infoText}>
                Les virements sont instantanés et irréversibles. Vérifiez les informations avant de confirmer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
