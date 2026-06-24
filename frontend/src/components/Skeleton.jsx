import styles from "./Skeleton.module.css";

/**
 * Bloc animé de substitution pendant le chargement.
 *
 * @prop {string|number} [width]    largeur (ex: "100%", 200)
 * @prop {string|number} [height]   hauteur (défaut: 16)
 * @prop {string|number} [radius]   border-radius (défaut: 6)
 * @prop {string}        [className]
 */
export function Skeleton({ width = "100%", height = 16, radius = 6, className = "" }) {
  const px = (v) => (typeof v === "number" ? `${v}px` : v);
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width: px(width), height: px(height), borderRadius: px(radius) }}
      aria-hidden="true"
    />
  );
}

/** Ligne : avatar rond + deux lignes de texte */
export function SkeletonListItem() {
  return (
    <div className={styles.listItem}>
      <Skeleton width={36} height={36} radius="50%" />
      <div className={styles.listItemLines}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  );
}

/** Carte solde squelette */
export function SkeletonBalanceCard() {
  return (
    <div className={styles.balanceCard}>
      <div className={styles.balanceTop}>
        <div>
          <Skeleton width={120} height={12} />
          <Skeleton width={180} height={28} style={{ marginTop: 8 }} />
        </div>
        <Skeleton width={48} height={32} radius={8} />
      </div>
      <div className={styles.balanceBottom}>
        <div>
          <Skeleton width={140} height={14} />
          <Skeleton width={200} height={12} style={{ marginTop: 6 }} />
        </div>
        <Skeleton width={50} height={22} radius={99} />
      </div>
    </div>
  );
}

/** Grille de 3 cartes stats */
export function SkeletonStatCards() {
  return (
    <div className={styles.statGrid}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton width="50%" height={12} />
          <Skeleton width="80%" height={24} style={{ marginTop: 8 }} />
          <Skeleton width="30%" height={12} style={{ marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

/** Carte squelette générique */
export function SkeletonCard({ children, className = "" }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}
