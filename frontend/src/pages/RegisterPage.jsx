import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import styles from "./AuthPage.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", pin: "", pinConfirm: "" });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { prenom, nom, email, pin, pinConfirm } = form;

    if (!prenom.trim() || !nom.trim() || !email.trim() || !pin) {
      showToast("Tous les champs sont requis.", "error");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showToast("Le PIN doit être composé de 4 chiffres.", "error");
      return;
    }
    if (pin !== pinConfirm) {
      showToast("Les deux PIN ne correspondent pas.", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await register(nom.trim(), prenom.trim(), email.trim(), pin);
      if (data.succes) {
        signIn(data.donnees);
        navigate("/");
      } else {
        showToast(data.message || "Erreur lors de la création du compte.", "error");
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
          <h1 className={styles.title}>Ouvrir un compte</h1>
          <p className={styles.sub}>Rejoignez NYAJ Banking gratuitement</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Prénom</label>
              <input value={form.prenom} onChange={set("prenom")} placeholder="Jean" autoFocus />
            </div>
            <div className={styles.field}>
              <label>Nom</label>
              <input value={form.nom} onChange={set("nom")} placeholder="Dupont" />
            </div>
          </div>
          <div className={styles.field}>
            <label>Adresse email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="jean.dupont@email.com" autoComplete="email" />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>PIN (4 chiffres)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={form.pin}
                onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="••••"
                autoComplete="new-password"
              />
            </div>
            <div className={styles.field}>
              <label>Confirmer le PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={form.pinConfirm}
                onChange={(e) => setForm((f) => ({ ...f, pinConfirm: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="••••"
              />
            </div>
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className={styles.footer}>
          Déjà un compte ?{" "}
          <Link to="/login" className={styles.link}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
