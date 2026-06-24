import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const showToast = useCallback((message, type = "error", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => Object.values(timersRef.current).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className={styles.container} aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`${styles.toast} ${t.type === "success" ? styles.success : styles.error}`}
              onClick={() => removeToast(t.id)}
              role="alert"
            >
              <span className={styles.icon}>
                {t.type === "success" ? "✓" : "⚠"}
              </span>
              <span className={styles.message}>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // En test ou hors provider, retourne un no-op silencieux
  if (!ctx) return { showToast: () => {} };
  return ctx;
}
