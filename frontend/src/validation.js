import { z } from "zod";

// --- Messages réutilisables ---
const REQUIRED = "Ce champ est requis.";
const INVALID_EMAIL = "Adresse email invalide.";
const PIN_4_DIGITS = "Le PIN doit comporter 4 chiffres.";
const PIN_MISMATCH = "Les PIN ne correspondent pas.";
const AMOUNT_POSITIVE = "Le montant doit être un nombre positif.";
const AMOUNT_REQUIRED = "Le montant est requis.";

// --- Auth ---
export const loginSchema = z.object({
  email: z.string().min(1, REQUIRED).email(INVALID_EMAIL),
  pin: z.string().min(1, REQUIRED).regex(/^\d{4}$/, PIN_4_DIGITS),
});

export const registerSchema = z.object({
  prenom: z.string().min(1, REQUIRED),
  nom: z.string().min(1, REQUIRED),
  email: z.string().min(1, REQUIRED).email(INVALID_EMAIL),
  pin: z.string().regex(/^\d{4}$/, PIN_4_DIGITS),
  pinConfirm: z.string(),
}).refine((d) => d.pin === d.pinConfirm, {
  message: PIN_MISMATCH,
  path: ["pinConfirm"],
});

// --- Comptes ---
export const createCompteSchema = z.object({
  nom: z.string().min(1, REQUIRED),
  prenom: z.string().min(1, REQUIRED),
});

// --- Opérations ---
export const operationSchema = z.object({
  montant: z.coerce.number().positive(AMOUNT_POSITIVE),
  description: z.string().optional(),
});

// --- Virement ---
export const virementSchema = z.object({
  destinataireId: z.string().min(1, "Choisissez un destinataire."),
  montant: z.coerce.number({ invalid_type_error: AMOUNT_REQUIRED }).positive(AMOUNT_POSITIVE),
  description: z.string().optional(),
});
