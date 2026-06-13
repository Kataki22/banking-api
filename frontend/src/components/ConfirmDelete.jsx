import { useState } from "react";
import { deleteCompte } from "../api";
import styles from "./ConfirmDelete.module.css";

export default function ConfirmDelete({ compte, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setLoading(true);
    try {
      const data = await deleteCompte(compte.id);
      if (data.succes) onConfirm();
      else setError(data.message || "Erreur lors de la suppression.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={`card ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Supprimer le compte ?</h3>
        <p className={styles.body}>
          Vous êtes sur le point de supprimer le compte de{" "}
          <strong>{compte.prenom} {compte.nom}</strong> (solde : {compte.solde}).
          Cette action est <strong>irréversible</strong>.
        </p>
        {error && <p className="error-msg">{error}</p>}
        <div className={styles.actions}>
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button className="btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Suppression..." : "Oui, supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
