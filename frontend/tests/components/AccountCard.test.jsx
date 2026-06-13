/**
 * SOUS-CATEGORIE : components/AccountCard
 * Tests du composant carte de compte bancaire
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AccountCard from "../../src/components/AccountCard";

const mockCompte = {
  id: "uuid-1",
  prenom: "Jean",
  nom: "Dupont",
  solde: "10000.00 FCFA",
  dateCreation: "12 juin 2026 à 10:00",
};

// -------------------------------------------------------------------
// Rendu
// -------------------------------------------------------------------
describe("AccountCard — rendu", () => {
  it("affiche le nom complet", () => {
    render(<AccountCard compte={mockCompte} onClick={() => {}} />);
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });

  it("affiche le solde formaté", () => {
    render(<AccountCard compte={mockCompte} onClick={() => {}} />);
    expect(screen.getByText("10000.00 FCFA")).toBeInTheDocument();
  });

  it("affiche la date de création", () => {
    render(<AccountCard compte={mockCompte} onClick={() => {}} />);
    expect(screen.getByText(/12 juin 2026/)).toBeInTheDocument();
  });

  it("affiche les initiales du compte", () => {
    render(<AccountCard compte={mockCompte} onClick={() => {}} />);
    // Les initiales sont JD (Jean Dupont)
    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Interaction
// -------------------------------------------------------------------
describe("AccountCard — interactions", () => {
  it("appelle onClick lors d'un clic", () => {
    const onClick = vi.fn();
    render(<AccountCard compte={mockCompte} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("appelle onClick lors d'une pression Entrée (accessibilité)", () => {
    const onClick = vi.fn();
    render(<AccountCard compte={mockCompte} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onClick pour une autre touche", () => {
    const onClick = vi.fn();
    render(<AccountCard compte={mockCompte} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Space" });
    expect(onClick).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------
// Variations de données
// -------------------------------------------------------------------
describe("AccountCard — variations", () => {
  it("affiche le solde à zéro", () => {
    const compte = { ...mockCompte, solde: "0.00 FCFA" };
    render(<AccountCard compte={compte} onClick={() => {}} />);
    expect(screen.getByText("0.00 FCFA")).toBeInTheDocument();
  });

  it("gère un nom avec une seule lettre pour les initiales", () => {
    const compte = { ...mockCompte, prenom: "A", nom: "B" };
    render(<AccountCard compte={compte} onClick={() => {}} />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("a un attribut tabIndex pour la navigation clavier", () => {
    render(<AccountCard compte={mockCompte} onClick={() => {}} />);
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("tabindex", "0");
  });
});
