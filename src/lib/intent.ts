// Classificação de intenção definicional.
// Regra central: uma palavra isolada NUNCA ativa definição.

export type Intent =
  | { kind: "definition"; term: string }
  | { kind: "greeting" }
  | { kind: "chat" };

const normalize = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const DEFINITION_PATTERNS: RegExp[] = [
  /^o que (?:significa|quer dizer) (?:a palavra |o termo )?["“]?(.+?)["”]?\??$/,
  /^qual (?:e |eh )?o significado (?:de|da|do) (?:palavra |termo )?["“]?(.+?)["”]?\??$/,
  /^significado (?:de|da|do) ["“]?(.+?)["”]?\??$/,
  /^defina ["“]?(.+?)["”]?\??$/,
  /^definicao (?:de|da|do) ["“]?(.+?)["”]?\??$/,
  /^o que (?:e|eh) (?:um |uma |o |a )?["“]?(.+?)["”]?\?$/,
];

const GREETINGS = ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "hey", "opa"];

export function classifyIntent(input: string): Intent {
  const text = normalize(input);
  if (!text) return { kind: "chat" };

  // Palavra isolada: nunca é definição.
  const words = text.replace(/[?!.,;:]/g, "").split(" ").filter(Boolean);
  if (words.length <= 1) {
    if (GREETINGS.includes(words[0] ?? "")) return { kind: "greeting" };
    return { kind: "chat" };
  }

  if (GREETINGS.includes(text.replace(/[?!.,]/g, ""))) return { kind: "greeting" };

  for (const re of DEFINITION_PATTERNS) {
    const m = text.match(re);
    if (m && m[1]) {
      const term = m[1].replace(/[?!.]+$/, "").trim();
      // "o que é" só conta se o termo for curto (contexto claramente definicional)
      if (term && term.split(" ").length <= 4) return { kind: "definition", term };
    }
  }
  return { kind: "chat" };
}