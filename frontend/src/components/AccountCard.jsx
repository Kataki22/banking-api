import styles from "./AccountCard.module.css";

export default function AccountCard({ compte, onClick }) {
  return (
    <div className={`card ${styles.card}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className={styles.initials}>
        {compte.prenom[0]}{compte.nom[0]}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{compte.prenom} {compte.nom}</p>
        <p className={styles.date}>{compte.dateCreation}</p>
      </div>
      <div className={styles.solde}>{compte.solde}</div>
    </div>
  );
}
