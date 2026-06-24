const BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, options);
  const data = await res.json();
  return { ...data, status: res.status };
}

// --- Auth ---
export const register = (nom, prenom, email, pin) =>
  apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, prenom, email, pin }),
  });

export const login = (email, pin) =>
  apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pin }),
  });

// --- Comptes ---
export const getComptes = () => apiFetch("/api/comptes");

export const getCompte = (id) => apiFetch(`/api/comptes/${id}`);

export const createCompte = (nom, prenom) =>
  apiFetch("/api/comptes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, prenom }),
  });

export const deleteCompte = (id) =>
  apiFetch(`/api/comptes/${id}`, { method: "DELETE" });

// --- Transactions ---
export const depot = (id, montant, description) =>
  apiFetch(`/api/comptes/${id}/depot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ montant, description }),
  });

export const retrait = (id, montant, description) =>
  apiFetch(`/api/comptes/${id}/retrait`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ montant, description }),
  });

export const virement = (sourceId, destinataireId, montant, description) =>
  apiFetch(`/api/comptes/${sourceId}/virement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinataireId, montant, description }),
  });

export const getTransactions = (id) => apiFetch(`/api/comptes/${id}/transactions`);
