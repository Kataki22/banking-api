/**
 * SOUS-CATEGORIE : components/TransactionList
 * Tests du composant d'affichage de l'historique des transactions
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TransactionList from "../../src/components/TransactionList";

const mockTransactions = [
  {
    id: "t1",
    type: "depot",
    montant: "5000.00 FCFA",
    montantRaw: 5000,
    description: "Salaire",
    date: "12 juin 2026 à 10:00",
  },
  {
    id: "t2",
    type: "retrait",
    montant: "1000.00 FCFA",
    montantRaw: 1000,
    description: null,
    date: "12 juin 2026 à 11:00",
  },
  {
    id: "t3",
    type: "virement_envoi",
    montant: "2000.00 FCFA",
    montantRaw: 2000,
    description: "Remboursement",
    date: "12 juin 2026 à 12:00",
  },
  {
    id: "t4",
    type: "virement_reception",
    montant: "500.00 FCFA",
    montantRaw: 500,
    description: null,
    date: "12 juin 2026 à 13:00",
  },
];

// -------------------------------------------------------------------
// Rendu vide
// -------------------------------------------------------------------
describe("TransactionList — liste vide", () => {
  it("affiche un message quand il n'y a aucune transaction", () => {
    render(<TransactionList transactions={[]} />);
    expect(screen.getByText(/aucune transaction/i)).toBeInTheDocument();
  });

  it("affiche un message quand transactions est undefined", () => {
    render(<TransactionList />);
    expect(screen.getByText(/aucune transaction/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Rendu avec données
// -------------------------------------------------------------------
describe("TransactionList — avec transactions", () => {
  it("affiche le bon nombre d'éléments", () => {
    render(<TransactionList transactions={mockTransactions} />);
    const items = document.querySelectorAll("li");
    expect(items).toHaveLength(4);
  });

  it("affiche les montants formatés", () => {
    render(<TransactionList transactions={mockTransactions} />);
    expect(screen.getByText(/5000\.00 FCFA/)).toBeInTheDocument();
    expect(screen.getByText(/1000\.00 FCFA/)).toBeInTheDocument();
  });

  it("affiche la description quand elle est fournie", () => {
    render(<TransactionList transactions={mockTransactions} />);
    expect(screen.getByText(/Salaire/)).toBeInTheDocument();
    expect(screen.getByText(/Remboursement/)).toBeInTheDocument();
  });

  it("affiche les dates", () => {
    render(<TransactionList transactions={mockTransactions} />);
    expect(screen.getAllByText(/12 juin 2026/).length).toBeGreaterThan(0);
  });
});

// -------------------------------------------------------------------
// Types de transactions
// -------------------------------------------------------------------
describe("TransactionList — types de transactions", () => {
  it("affiche 'Dépôt' pour le type depot", () => {
    render(<TransactionList transactions={[mockTransactions[0]]} />);
    expect(screen.getByText(/Dépôt/i)).toBeInTheDocument();
  });

  it("affiche 'Retrait' pour le type retrait", () => {
    render(<TransactionList transactions={[mockTransactions[1]]} />);
    expect(screen.getByText(/Retrait/i)).toBeInTheDocument();
  });

  it("affiche 'Virement envoyé' pour virement_envoi", () => {
    render(<TransactionList transactions={[mockTransactions[2]]} />);
    expect(screen.getByText(/Virement envoyé/i)).toBeInTheDocument();
  });

  it("affiche 'Virement reçu' pour virement_reception", () => {
    render(<TransactionList transactions={[mockTransactions[3]]} />);
    expect(screen.getByText(/Virement reçu/i)).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------
// Signes +/-
// -------------------------------------------------------------------
describe("TransactionList — signes de montant", () => {
  it("préfixe + pour un dépôt", () => {
    render(<TransactionList transactions={[mockTransactions[0]]} />);
    expect(screen.getByText(/\+5000\.00 FCFA/)).toBeInTheDocument();
  });

  it("préfixe - pour un retrait", () => {
    render(<TransactionList transactions={[mockTransactions[1]]} />);
    expect(screen.getByText(/-1000\.00 FCFA/)).toBeInTheDocument();
  });

  it("préfixe + pour un virement reçu", () => {
    render(<TransactionList transactions={[mockTransactions[3]]} />);
    expect(screen.getByText(/\+500\.00 FCFA/)).toBeInTheDocument();
  });

  it("préfixe - pour un virement envoyé", () => {
    render(<TransactionList transactions={[mockTransactions[2]]} />);
    expect(screen.getByText(/-2000\.00 FCFA/)).toBeInTheDocument();
  });
});
