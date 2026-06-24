import { Component } from "react";
import styles from "./ErrorBoundary.module.css";

/**
 * Capture les erreurs de rendu dans l'arbre enfant.
 * Affiche un message propre + bouton "Réessayer" au lieu d'un écran blanc.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.icon}>⚠</div>
            <h2 className={styles.title}>Une erreur est survenue</h2>
            <p className={styles.message}>
              {this.state.error?.message ||
                "Erreur inattendue lors du rendu de la page."}
            </p>
            <button className="btn-primary" onClick={this.handleRetry}>
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
