import styles from "./TransactionList.module.css";

const LABELS = {
  depot:              { label: "Dépôt",    badge: "badge-green",  sign: "+", icon: "↓" },
  retrait:            { label: "Retrait",  badge: "badge-red",    sign: "-", icon: "↑" },
  virement_envoi:     { label: "Virement envoyé",   badge: "badge-orange", sign: "-", icon: "→" },
  virement_reception: { label: "Virement reçu",     badge: "badge-blue",   sign: "+", icon: "←" },
};

import { memo } from "react";

function TransactionList({ transactions = [] }) {
  if (transactions.length === 0) {
    return <p className={styles.empty}>Aucune transaction pour le moment.</p>;
  }

  return (
    <ul className={styles.list}>
      {transactions.map((t) => {
        const meta = LABELS[t.type] || { label: t.type, badge: "badge-blue", sign: "", icon: "•" };
        const isCredit = meta.sign === "+";
        return (
          <li key={t.id} className={styles.item}>
            <div className={`${styles.icon} ${isCredit ? styles.iconCredit : styles.iconDebit}`}>
              {meta.icon}
            </div>
            <div className={styles.info}>
              <p className={styles.label}>
                {meta.label}
                {t.description && <span className={styles.desc}> — {t.description}</span>}
              </p>
              <p className={styles.date}>{t.date}</p>
            </div>
            <div className={`${styles.amount} ${isCredit ? styles.positive : styles.negative}`}>
              {meta.sign}{t.montant}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default memo(TransactionList);
