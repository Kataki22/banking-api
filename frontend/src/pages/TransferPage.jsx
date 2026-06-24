import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getComptes, virement } from "../api";
import { Skeleton } from "../components/Skeleton";
import styles from "./TransferPage.module.css";

export default function TransferPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [comptes, setComptes] = useState([]);
  const [destinataireId, setDestinataire] = useState("");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    getComptes()
      .then((d) => {
        if (d.succes) setComptes(d.donnees.filter((c) => c.id !== user.id));
      })
      .finally(() => setLoadingList(false));
  }, [user.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    const val = parseFloat(montant);
    if (!destinataireId) { showToast("Choisissez un destinataire.", "error"); return; }
    if (!val || val <= 0) { showToast("Montant invalide.", "error"); return; }

    setLoading(true);
    try {
      const data = await virement(user.id, destinataireId, val, description.trim() || undefined);
      if (data.succes) {
        updateUser(data.donnees.source);
        showToast(data.message, "success");
        setMontant(""); setDescription(""); setDestinataire("");
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Impossible de contacter le serveur.", "error");
    } finally {
      setLoading(false);
    }
  }

  const dest = useMemo(() => comptes.find((c) => c.id === destinataireId), [comptes, destinataireId]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <button className="btn-ghost" style={{fontSize:"13px",padding:"6px 12px"}} onClick={() => navigate("/")}>
            ← Retour
          </button>
          <h2 className={styles.pageTitle}>Effectuer un virement</h2>
        </div>

        <div className={styles.grid}>
          {/* Formulaire */}
          <div className={`card ${styles.formCard}`}>
            <h3 className={styles.cardTitle}>Détails du virement</h3>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Expéditeur */}
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

              {/* Destinataire */}
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
                  <select value={destinataireId} onChange={(e) => setDestinataire(e.target.value)}>
                    <option value="">-- Sélectionner un compte --</option>
                    {comptes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom}{c.email ? ` — ${c.email}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Montant */}
              <div className={styles.field}>
                <label>Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex : 10000"
                />
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label>Motif <span className={styles.opt}>(optionnel)</span></label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : Remboursement loyer"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "13px" }}
                disabled={loading || !destinataireId || !montant}
              >
                {loading ? "Traitement..." : "Confirmer le virement"}
              </button>
            </form>
          </div>

          {/* Résumé */}
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
