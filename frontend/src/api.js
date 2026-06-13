const BASE = "http://localhost:3000/api";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { ...data, status: res.status };
}

// --- Auth ---
export const register = (nom, prenom, email, pin) =>
  apiFetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, prenom, email, pin }),
  });

export const login = (email, pin) =>
  apiFetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pin }),
  });

// --- Comptes ---
export const getComptes = () => apiFetch(`${BASE}/comptes`);

export const getCompte = (id) => apiFetch(`${BASE}/comptes/${id}`);

export const createCompte = (nom, prenom) =>
  apiFetch(`${BASE}/comptes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, prenom }),
  });

export const deleteCompte = (id) =>
  apiFetch(`${BASE}/comptes/${id}`, { method: "DELETE" });

// --- Transactions ---
export const depot = (id, montant, description) =>
  apiFetch(`${BASE}/comptes/${id}/depot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ montant, description }),
  });

export const retrait = (id, montant, description) =>
  apiFetch(`${BASE}/comptes/${id}/retrait`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ montant, description }),
  });

export const virement = (sourceId, destinataireId, montant, description) =>
  apiFetch(`${BASE}/comptes/${sourceId}/virement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinataireId, montant, description }),
  });

export const getTransactions = (id) => apiFetch(`${BASE}/comptes/${id}/transactions`);
