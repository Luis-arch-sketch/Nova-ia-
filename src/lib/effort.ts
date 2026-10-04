export const EFFORT_LEVELS = [
  { id: "minimo", label: "Mínimo", description: "Resposta direta", theme: "liquido" },
  { id: "baixo", label: "Baixo", description: "Resumo curto", theme: "liquido" },
  { id: "medio", label: "Médio", description: "Detalhamento padrão", theme: "liquido" },
  { id: "alto", label: "Alto", description: "Explicação ampliada", theme: "galaxy" },
  { id: "maximo", label: "Máximo", description: "Resposta mais completa", theme: "galaxy" },
] as const;

export type EffortLevel = (typeof EFFORT_LEVELS)[number]["id"];
export const DEFAULT_EFFORT: EffortLevel = "medio";
export const EFFORT_KEY = "nova-ia-effort";

export function isEffortLevel(value: string | null): value is EffortLevel {
  return EFFORT_LEVELS.some((level) => level.id === value);
}

export function effortIndex(value: EffortLevel): number {
  return EFFORT_LEVELS.findIndex((level) => level.id === value);
}
