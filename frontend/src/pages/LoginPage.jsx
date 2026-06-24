import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { loginSchema } from "../validation";
import styles from "./AuthPage.module.css";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data) {
    try {
      const res = await login(data.email, data.pin);
      if (res.succes) {
        signIn(res.donnees);
        navigate("/");
      } else {
        showToast(res.message || "Email ou PIN incorrect.", "error");
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
          <h1 className={styles.title}>NYAJ Banking</h1>
          <p className={styles.sub}>Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Adresse email</label>
            <input
              type="email"
              {...register("email")}
              placeholder="jean.dupont@email.com"
              autoFocus
              autoComplete="email"
            />
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>
          <div className={styles.field}>
            <label>PIN (4 chiffres)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              {...register("pin")}
              placeholder="••••"
              autoComplete="current-password"
            />
            {errors.pin && <p className="error-msg">{errors.pin.message}</p>}
          </div>

          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
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
