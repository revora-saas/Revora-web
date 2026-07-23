export interface RdvVue {
  id: string;
  clientId: string | null;
  clientNom: string;
  clientTel: string | null;
  clientFiabilite: number | null;
  prestations: string[];
  statut: string;
  debutExecution: string;
  finExecution: string;
  debutBloque: string;
  finBloque: string;
  poses: { debut: string; fin: string }[];
  horsPlage: boolean;
}

export interface BlocVue {
  id: string;
  motif: string | null;
  type: string;
  debut: string;
  fin: string;
}

export interface IntervalleVue {
  debut: string;
  fin: string;
}

export const STATUTS_RDV: Record<string, { label: string; classe: string }> = {
  demande: { label: "Demande", classe: "bg-amber-100 text-amber-800 border-amber-300" },
  confirme: { label: "Confirmé", classe: "bg-primary-50 text-primary-700 border-primary/30" },
  a_qualifier: { label: "À qualifier", classe: "bg-orange-100 text-orange-800 border-orange-300" },
  honore: { label: "Honoré", classe: "bg-green-100 text-green-800 border-green-300" },
  absent: { label: "Absent", classe: "bg-red-100 text-red-800 border-red-300" },
};
