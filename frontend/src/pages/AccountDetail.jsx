import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCompte, getTransactions, depot, retrait, deleteCompte } from "../api";
import TransactionList from "../components/TransactionList";
import ConfirmDelete from "../components/ConfirmDelete";
import styles from "./AccountDetail.module.css";

function OpForm({ title, btnClass, btnLabel, onSubmit, loading }) {
  const [montant, setMontant] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handle(e) {
    e.preventDefault();
    const val = parseFloat(montant);
    if (!val || val <= 0) { setError("Montant invalide."); return; }
    setError(null); setSuccess(null);
    const msg = await onSubmit(val, desc.trim() || undefined);
    if (msg.succes) {
      setSuccess(msg.message);
      setMontant(""); setDesc("");
    } else {
      setError(msg.message);
    }
  }

  return (
    <div className={`card ${styles.opCard}`}>
      <h3 className={styles.opTitle}>{title}</h3>
      <form onSubmit={handle} className={styles.opForm}>
        <div className={styles.field}>
          <label>Montant (FCFA)</label>
          <input
            type="number"
            min="1"
            step="any"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Ex : 5000"
          />
        </div>
        <div className={styles.field}>
          <label>Description <span className={styles.opt}>(optionnel)</span></label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex : Salaire" />
        </div>
        {error   && <p className="error-msg">⚠ {error}</p>}
        {success && <p className="success-msg">✓ {success}</p>}
        <button type="submit" className={btnClass} disabled={loading}>{btnLabel}</button>
      </form>
    </div>
  );
}

export default function AccountDetail() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [compte, setCompte] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("operations");
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const [cData, tData] = await Promise.all([getCompte(id), getTransactions(id)]);
      if (!cData.succes) { setError("Compte introuvable."); return; }
      setCompte(cData.donnees);
      setTransactions(tData.donnees || []);
      if (id === user?.id) updateUser(cData.donnees);
    } catch {
      setError("Impossible de contacter le serveur.");
    }
  }

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [id]);

  if (loading) return <div className={styles.center}>Chargement...</div>;
  if (error)   return <div className={`${styles.center} error-msg`}>⚠ {error}</div>;

  const isOwn = id === user?.id;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Header compte */}
        <div className={`card ${styles.header}`}>
          <button className={`btn-ghost ${styles.backBtn}`} onClick={() => navigate("/")}>← Retour</button>
          <div className={styles.headerContent}>
            <div className={styles.avatar}>
              {compte.prenom?.[0]}{compte.nom?.[0]}
            </div>
            <div>
              <h2 className={styles.name}>{compte.prenom} {compte.nom}</h2>
              {compte.email && <p className={styles.email}>{compte.email}</p>}
              <p className={styles.date}>Compte créé le {compte.dateCreation}</p>
            </div>
            <div className={styles.soldeBox}>
              <span className={styles.soldeLabel}>Solde</span>
              <span className={styles.solde}>{compte.solde}</span>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className={styles.tabs}>
          <button className={tab === "operations" ? styles.tabActive : styles.tab} onClick={() => setTab("operations")}>
            Opérations
          </button>
          <button className={tab === "historique" ? styles.tabActive : styles.tab} onClick={() => setTab("historique")}>
            Historique ({transactions.length})
          </button>
        </div>

        {tab === "operations" ? (
          <div className={styles.opsGrid}>
            <OpForm
              title="Effectuer un dépôt"
              btnClass="btn-success"
              btnLabel="Déposer"
              loading={loading}
              onSubmit={async (montant, desc) => {
                const r = await depot(id, montant, desc);
                if (r.succes) await refresh();
                return r;
              }}
            />
            <OpForm
              title="Effectuer un retrait"
              btnClass="btn-warning"
              btnLabel="Retirer"
              loading={loading}
              onSubmit={async (montant, desc) => {
                const r = await retrait(id, montant, desc);
                if (r.succes) await refresh();
                return r;
              }}
            />

            {isOwn && (
              <div className={`card ${styles.dangerCard}`}>
                <h3 className={styles.dangerTitle}>Zone de danger</h3>
                <p className={styles.dangerText}>
                  La suppression du compte est <strong>irréversible</strong>. Toutes les transactions seront perdues.
                </p>
                <button className="btn-danger" onClick={() => setShowDelete(true)}>
                  Supprimer le compte
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`card ${styles.histCard}`}>
            <TransactionList transactions={transactions} />
          </div>
        )}

        {showDelete && (
          <ConfirmDelete
            compte={compte}
            onConfirm={() => {
              deleteCompte(id).then(() => navigate("/"));
            }}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </div>
    </div>
  );
}
