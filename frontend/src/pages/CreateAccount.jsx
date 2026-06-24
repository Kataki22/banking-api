import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCompte } from "../api";
import { useToast } from "../context/ToastContext";
import styles from "./CreateAccount.module.css";

export default function CreateAccount() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) {
      showToast("Le nom et le prénom sont obligatoires.", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await createCompte(nom.trim(), prenom.trim());
      if (data.succes) {
        navigate(`/comptes/${data.donnees.id}`);
      } else {
        showToast(data.message || "Erreur lors de la création.", "error");
      }
    } catch {
      showToast("Le serveur est inaccessible.", "error");
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
