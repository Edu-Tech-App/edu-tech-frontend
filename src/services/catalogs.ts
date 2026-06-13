export type BookCategory =
  | "INGENIERIA_SISTEMAS"
  | "INGENIERIA_CIVIL"
  | "INGENIERIA_INDUSTRIAL"
  | "ADMINISTRACION"
  | "CONTADURIA"
  | "ECONOMIA"
  | "DERECHO"
  | "MEDICINA"
  | "ENFERMERIA"
  | "PSICOLOGIA"
  | "EDUCACION"
  | "MATEMATICAS";

export const BOOK_CATEGORY_LABELS: Record<BookCategory, string> = {
  INGENIERIA_SISTEMAS: "Ingeniería de Sistemas",
  INGENIERIA_CIVIL: "Ingeniería Civil",
  INGENIERIA_INDUSTRIAL: "Ingeniería Industrial",
  ADMINISTRACION: "Administración",
  CONTADURIA: "Contaduría",
  ECONOMIA: "Economía",
  DERECHO: "Derecho",
  MEDICINA: "Medicina",
  ENFERMERIA: "Enfermería",
  PSICOLOGIA: "Psicología",
  EDUCACION: "Educación",
  MATEMATICAS: "Matemáticas",
};

export const formatBookCategory = (value?: string | null) => {
  if (!value) return "";
  return BOOK_CATEGORY_LABELS[value as BookCategory] || value;
};
