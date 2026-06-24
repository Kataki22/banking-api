import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { registerSchema } from "../validation";
import styles from "./AuthPage.module.css";

export default function RegisterPage() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data) {
    try {
      const res = await registerApi(data.nom, data.prenom, data.email, data.pin);
      if (res.succes) {
        signIn(res.donnees);
        navigate("/");
      } else {
        showToast(res.message || "Erreur lors de la création du compte.", "error");
      }
    } catch {
      showToast("Impossible de contacter le serveur.", "error");
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

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Prénom</label>
              <input {...register("prenom")} placeholder="Jean" autoFocus />
              {errors.prenom && <p className="error-msg">{errors.prenom.message}</p>}
            </div>
            <div className={styles.field}>
              <label>Nom</label>
              <input {...register("nom")} placeholder="Dupont" />
              {errors.nom && <p className="error-msg">{errors.nom.message}</p>}
            </div>
          </div>
          <div className={styles.field}>
            <label>Adresse email</label>
            <input
              type="email"
              {...register("email")}
              placeholder="jean.dupont@email.com"
              autoComplete="email"
            />
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>PIN (4 chiffres)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                {...register("pin")}
                placeholder="••••"
                autoComplete="new-password"
              />
              {errors.pin && <p className="error-msg">{errors.pin.message}</p>}
            </div>
            <div className={styles.field}>
              <label>Confirmer le PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                {...register("pinConfirm")}
                placeholder="••••"
              />
              {errors.pinConfirm && <p className="error-msg">{errors.pinConfirm.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Création..." : "Créer mon compte"}
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
