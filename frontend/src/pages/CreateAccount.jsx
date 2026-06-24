import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { createCompte } from "../api";
import { useToast } from "../context/ToastContext";
import { createCompteSchema } from "../validation";
import styles from "./CreateAccount.module.css";

export default function CreateAccount() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createCompteSchema) });

  async function onSubmit(data) {
    try {
      const res = await createCompte(data.nom, data.prenom);
      if (res.succes) {
        navigate(`/comptes/${res.donnees.id}`);
      } else {
        showToast(res.message || "Erreur lors de la création.", "error");
      }
    } catch {
      showToast("Le serveur est inaccessible.", "error");
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={`card ${styles.card}`}>
        <h2 className={styles.title}>Nouveau compte</h2>
        <p className={styles.sub}>Le solde initial sera de 0.00 FCFA.</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Nom</label>
            <input {...register("nom")} placeholder="Ex : Dupont" autoFocus />
            {errors.nom && <p className="error-msg">{errors.nom.message}</p>}
          </div>
          <div className={styles.field}>
            <label>Prénom</label>
            <input {...register("prenom")} placeholder="Ex : Jean" />
            {errors.prenom && <p className="error-msg">{errors.prenom.message}</p>}
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-ghost" onClick={() => navigate("/")}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
