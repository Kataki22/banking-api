import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import styles from "./AuthPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !pin.trim()) {
      showToast("Tous les champs sont requis.", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), pin.trim());
      if (data.succes) {
        signIn(data.donnees);
        navigate("/");
      } else {
        showToast(data.message || "Email ou PIN incorrect.", "error");
      }
    } catch {
      showToast("Impossible de contacter le serveur.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>🏦</div>
          <h1 className={styles.title}>NYAJ Banking</h1>
          <p className={styles.sub}>Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@email.com"
              autoFocus
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label>PIN (4 chiffres)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className={styles.footer}>
          Pas encore de compte ?{" "}
          <Link to="/register" className={styles.link}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
