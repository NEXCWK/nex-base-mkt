export type UsoTipo = "primeiro" | "segundo";
export type StatusComunicacao = "mapeado" | "data-a-confirmar" | "data-confirmada";

export interface AvulsoContato {
  id: string;
  name: string;
  instagram: string;
  uso: UsoTipo;
  status: StatusComunicacao;
  data: string; // yyyy-mm-dd, "" when not yet set
  notas: string;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by the public (no-auth) endpoint — confirmed entries only,
// stripped of internal notes.
export interface PublicConfirmedEntry {
  id: string;
  name: string;
  instagram: string;
  uso: UsoTipo;
  data: string;
}

export const USO_META: Record<UsoTipo, { label: string; chip: string; dot: string }> = {
  primeiro: { label: "Primeiro Uso", chip: "bg-accent text-black", dot: "bg-accent" },
  segundo: { label: "Segundo Uso", chip: "bg-black text-white", dot: "bg-black" },
};

export const STATUS_META: Record<StatusComunicacao, { label: string; chip: string }> = {
  mapeado: { label: "Mapeado", chip: "bg-gray-light text-gray-dark" },
  "data-a-confirmar": { label: "Data à Confirmar", chip: "bg-amber-50 text-amber-700 border border-amber-200" },
  "data-confirmada": { label: "Data Confirmada", chip: "bg-green-50 text-green-700 border border-green-200" },
};
