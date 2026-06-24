import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getCompte, getTransactions } from "../api";
import TransactionList from "../components/TransactionList";
import { SkeletonBalanceCard, SkeletonStatCards, Skeleton, SkeletonCard, SkeletonListItem } from "../components/Skeleton";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [cData, tData] = await Promise.all([
        getCompte(user.id),
        getTransactions(user.id),
      ]);
      if (cData.succes) updateUser(cData.donnees);
      if (tData.succes) setTransactions(tData.donnees || []);
    } catch {
      showToast("Impossible de contacter le serveur.", "error");
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [user.id]);

  const soldeNum = parseFloat(user.solde) || 0;
  const depots   = useMemo(() => transactions.filter((t) => t.type === "depot" || t.type === "virement_reception"), [transactions]);
  const retraits = useMemo(() => transactions.filter((t) => t.type === "retrait" || t.type === "virement_envoi"), [transactions]);
  const totalDepots   = useMemo(() => depots.reduce((s, t) => s + (t.montantRaw || 0), 0), [depots]);
  const totalRetraits = useMemo(() => retraits.reduce((s, t) => s + (t.montantRaw || 0), 0), [retraits]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <SkeletonBalanceCard />
          <SkeletonStatCards />
          <SkeletonCard>
            <Skeleton width={120} height={14} style={{ marginBottom: 16 }} />
            {[1, 2, 3].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </SkeletonCard>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Carte solde principale */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceTop}>
            <div>
              <p className={styles.balanceLabel}>Solde disponible</p>
              <p className={styles.balanceAmount}>
                {user.solde}
              </p>
            </div>
            <div className={styles.cardChip}>
              <div className={styles.chip} />
            </div>
          </div>
          <div className={styles.balanceBottom}>
            <div>
              <p className={styles.cardOwner}>{user.prenom} {user.nom}</p>
              <p className={styles.cardSub}>Compte courant • {user.email}</p>
            </div>
            <span className={`badge badge-blue`}>Actif</span>
          </div>
        </div>

        {/* Stats rapides */}
        <div className={styles.statsGrid}>
          <div className={`card ${styles.statCard}`}>
            <p className={styles.statLabel}>Total dépôts</p>
            <p className={`${styles.statValue} ${styles.green}`}>
              +{totalDepots.toFixed(2)} FCFA
            </p>
            <p className={styles.statCount}>{depots.length} opération{depots.length !== 1 ? "s" : ""}</p>
          </div>
          <div className={`card ${styles.statCard}`}>
            <p className={styles.statLabel}>Total débits</p>
            <p className={`${styles.statValue} ${styles.red}`}>
              -{totalRetraits.toFixed(2)} FCFA
            </p>
            <p className={styles.statCount}>{retraits.length} opération{retraits.length !== 1 ? "s" : ""}</p>
          </div>
          <div className={`card ${styles.statCard}`}>
            <p className={styles.statLabel}>Transactions</p>
            <p className={styles.statValue}>{transactions.length}</p>
            <p className={styles.statCount}>au total</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className={styles.quickActions}>
          <button className={`btn-success ${styles.actionBtn}`} onClick={() => navigate(`/comptes/${user.id}`)}>
            <span>↓</span> Dépôt
          </button>
          <button className={`btn-warning ${styles.actionBtn}`} onClick={() => navigate(`/comptes/${user.id}`)}>
            <span>↑</span> Retrait
          </button>
          <button className={`btn-primary ${styles.actionBtn}`} onClick={() => navigate("/virement")}>
            <span>↔</span> Virement
          </button>
          <button className={`btn-ghost ${styles.actionBtn}`} onClick={() => navigate(`/comptes/${user.id}`)}>
            <span>⚙</span> Mon compte
          </button>
        </div>

        {/* Historique récent */}
        <div className={`card ${styles.histCard}`}>
          <div className={styles.histHeader}>
            <h3>Transactions récentes</h3>
            <button className="btn-ghost" style={{fontSize:"13px",padding:"6px 12px"}} onClick={() => navigate(`/comptes/${user.id}`)}>
              Voir tout
            </button>
          </div>
          <TransactionList transactions={transactions.slice(0, 6)} />
        </div>

      </div>
    </div>
  );
}
