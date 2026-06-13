import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCompte } from "../api";
import styles from "./CreateAccount.module.css";

export default function CreateAccount() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) {
      setError("Le nom et le prénom sont obligatoires.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await createCompte(nom.trim(), prenom.trim());
      if (data.succes) {
        navigate(`/comptes/${data.donnees.id}`);
      } else {
        setError(data.message || "Erreur lors de la création.");
      }
    } catch {
      setError("Le serveur est inaccessible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={`card ${styles.card}`}>
        <h2 className={styles.title}>Nouveau compte</h2>
        <p className={styles.sub}>Le solde initial sera de 0.00 FCFA.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : Dupont"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Prénom</label>
            <input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Ex : Jean"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className={styles.actions}>
            <button type="button" className="btn-ghost" onClick={() => navigate("/")}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
