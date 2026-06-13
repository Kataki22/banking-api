import { useState } from "react";
import { depot } from "../api";
import styles from "./OpForm.module.css";

export default function DepositForm({ id, onSuccess }) {
  const [montant, setMontant] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const val = parseFloat(montant);
    if (isNaN(val) || val <= 0) { setMsg({ type: "error", text: "Montant invalide." }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const data = await depot(id, val);
      if (data.succes) {
        setMsg({ type: "success", text: data.message });
        setMontant("");
        onSuccess();
      } else {
        setMsg({ type: "error", text: data.message });
      }
    } catch {
      setMsg({ type: "error", text: "Erreur réseau." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`card ${styles.card}`}>
      <h3 className={styles.title}>💰 Dépôt</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Montant (FCFA)"
        />
        {msg && <p className={msg.type === "error" ? "error-msg" : "success-msg"}>{msg.text}</p>}
        <button type="submit" className={`btn-success ${styles.btn}`} disabled={loading}>
          {loading ? "En cours..." : "Déposer"}
        </button>
      </form>
    </div>
  );
}
