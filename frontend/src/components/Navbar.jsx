import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  const initials = user ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() : "?";

  return (
    <nav className={styles.nav} data-testid="navbar">
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏦</span>
          <span>NYAJ <span className={styles.logoSub}>Banking</span></span>
        </Link>

        <div className={styles.links}>
          <Link to="/"          className={`${styles.link} ${location.pathname === "/"          ? styles.active : ""}`}>Tableau de bord</Link>
          <Link to="/virement"  className={`${styles.link} ${location.pathname === "/virement"  ? styles.active : ""}`}>Virement</Link>
        </div>

        <div className={styles.right}>
          <div className={styles.avatar} title={user ? `${user.prenom} ${user.nom}` : ""}>
            {initials}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.prenom} {user?.nom}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <button className={`btn-ghost ${styles.logoutBtn}`} onClick={handleSignOut}>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
