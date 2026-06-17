/**
 * SOUS-CATEGORIE : context/AuthContext
 * Tests du contexte d'authentification
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/context/AuthContext";

const mockCompte = {
  id: "acc-001",
  prenom: "Serge",
  nom: "Mbarga",
  email: "serge.mbarga@email.com",
  solde: "5000.00 FCFA",
};

// Composant test pour accéder au contexte
function TestConsumer({ onRender }) {
  const auth = useAuth();
  onRender(auth);
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.prenom : "null"}</span>
      <button onClick={() => auth.signIn(mockCompte)}>signIn</button>
      <button onClick={() => auth.signOut()}>signOut</button>
      <button onClick={() => auth.updateUser({ ...mockCompte, solde: "9000.00 FCFA" })}>updateUser</button>
    </div>
  );
}

function renderWithProvider(onRender = vi.fn()) {
  return render(
    <AuthProvider>
      <TestConsumer onRender={onRender} />
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// -------------------------------------------------------------------
// État initial
// -------------------------------------------------------------------
describe("AuthContext — état initial", () => {
  it("user est null si localStorage est vide", () => {
    renderWithProvider();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("restaure l'utilisateur depuis localStorage", () => {
    localStorage.setItem("nyaj_user", JSON.stringify(mockCompte));
    renderWithProvider();
    expect(screen.getByTestId("user").textContent).toBe("Serge");
  });

  it("retourne null si le localStorage contient du JSON invalide", () => {
    localStorage.setItem("nyaj_user", "INVALID_JSON");
    renderWithProvider();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });
});

// -------------------------------------------------------------------
// signIn
// -------------------------------------------------------------------
describe("AuthContext — signIn", () => {
  it("met à jour user après signIn", async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText("signIn"));
    });
    expect(screen.getByTestId("user").textContent).toBe("Serge");
  });

  it("sauvegarde l'utilisateur dans localStorage après signIn", async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText("signIn"));
    });
    const stored = JSON.parse(localStorage.getItem("nyaj_user"));
    expect(stored.id).toBe("acc-001");
  });
});

// -------------------------------------------------------------------
// signOut
// -------------------------------------------------------------------
describe("AuthContext — signOut", () => {
  it("remet user à null après signOut", async () => {
    localStorage.setItem("nyaj_user", JSON.stringify(mockCompte));
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText("signOut"));
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("supprime l'utilisateur du localStorage après signOut", async () => {
    localStorage.setItem("nyaj_user", JSON.stringify(mockCompte));
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText("signOut"));
    });
    expect(localStorage.getItem("nyaj_user")).toBeNull();
  });
});

// -------------------------------------------------------------------
// updateUser
// -------------------------------------------------------------------
describe("AuthContext — updateUser", () => {
  it("met à jour user avec le nouveau solde", async () => {
    localStorage.setItem("nyaj_user", JSON.stringify(mockCompte));
    const onRender = vi.fn();
    renderWithProvider(onRender);
    await act(async () => {
      fireEvent.click(screen.getByText("updateUser"));
    });
    const lastCall = onRender.mock.calls[onRender.mock.calls.length - 1][0];
    expect(lastCall.user.solde).toBe("9000.00 FCFA");
  });

  it("met à jour localStorage après updateUser", async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText("updateUser"));
    });
    const stored = JSON.parse(localStorage.getItem("nyaj_user"));
    expect(stored.solde).toBe("9000.00 FCFA");
  });
});

// -------------------------------------------------------------------
// useAuth
// -------------------------------------------------------------------
describe("AuthContext — useAuth", () => {
  it("expose signIn, signOut, updateUser et user", () => {
    const onRender = vi.fn();
    renderWithProvider(onRender);
    const auth = onRender.mock.calls[0][0];
    expect(typeof auth.signIn).toBe("function");
    expect(typeof auth.signOut).toBe("function");
    expect(typeof auth.updateUser).toBe("function");
    expect("user" in auth).toBe(true);
  });
});
