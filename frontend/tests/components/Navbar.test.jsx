/**
 * SOUS-CATEGORIE : components/Navbar
 * Tests de la barre de navigation principale
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../../src/components/Navbar";
import { AuthContext } from "../../src/context/AuthContext";

// Helper pour rendre Navbar avec un contexte auth mocké
function renderNavbar(user, signOut = vi.fn()) {
  return render(
    <AuthContext.Provider value={{ user, signOut }}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const mockUser = {
  id: "uuid-1",
  prenom: "Jean",
  nom: "Dupont",
  email: "jean@test.com",
  solde: "10000.00 FCFA",
};

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("Navbar — rendu", () => {
  it("affiche le logo NYAJ Banking", () => {
    renderNavbar(mockUser);
    expect(screen.getByText(/NYAJ/i)).toBeInTheDocument();
  });

  it("affiche le nom de l'utilisateur connecté", () => {
    renderNavbar(mockUser);
    expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
  });

  it("affiche l'email de l'utilisateur", () => {
    renderNavbar(mockUser);
    expect(screen.getByText("jean@test.com")).toBeInTheDocument();
  });

  it("affiche les initiales dans l'avatar", () => {
    renderNavbar(mockUser);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("affiche le lien Tableau de bord", () => {
    renderNavbar(mockUser);
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
  });

  it("affiche le lien Virement", () => {
    renderNavbar(mockUser);
    expect(screen.getByText(/Virement/i)).toBeInTheDocument();
  });

  it("affiche le bouton Déconnexion", () => {
    renderNavbar(mockUser);
    expect(screen.getByText(/Déconnexion/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Déconnexion
// -------------------------------------------------------------------
describe("Navbar — déconnexion", () => {
  it("appelle signOut lors d'un clic sur Déconnexion", () => {
    const signOut = vi.fn();
    renderNavbar(mockUser, signOut);
    fireEvent.click(screen.getByText(/Déconnexion/i));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

// -------------------------------------------------------------------
// Accessibilité
// -------------------------------------------------------------------
describe("Navbar — accessibilité", () => {
  it("la navbar a le data-testid 'navbar'", () => {
    renderNavbar(mockUser);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("le logo est un lien vers /", () => {
    renderNavbar(mockUser);
    const logo = screen.getByText(/NYAJ/i).closest("a");
    expect(logo).toHaveAttribute("href", "/");
  });
});
