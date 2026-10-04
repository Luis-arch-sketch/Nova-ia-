import { classifyIntent } from "./intent";

export const MODEL_NAME = "NOVA IA";

const GLOSSARY: Record<string, string> = {
  casa: "lugar onde uma pessoa ou família mora; lar, residência.",
  amor: "sentimento de afeto profundo, cuidado e ligação por alguém ou algo.",
  curiosidade: "desejo de saber, aprender ou descobrir algo novo.",
  jogo: "atividade com regras, feita por diversão, competição ou aprendizado.",
  galaxia: "enorme sistema de estrelas, gás e poeira unidos pela gravidade.",
  inteligencia: "capacidade de aprender, compreender e resolver problemas.",
};

const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function reply(input: string): string {
  const intent = classifyIntent(input);
  if (intent.kind === "greeting") {
    return "Olá! Eu sou a NOVA IA. Como posso ajudar você hoje?";
  }
  if (intent.kind === "definition") {
    const def = GLOSSARY[strip(intent.term)];
    if (def) return `**${intent.term}**: ${def}`;
    return `Ainda não tenho uma definição salva para “${intent.term}” nesta versão local da NOVA IA. Pode me dar mais contexto?`;
  }
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return `Você escreveu “${words[0]}”. Quer conversar sobre isso? Conte um pouco mais do que você tem em mente. Se quiser o significado, é só perguntar “o que significa ${words[0]}?”.`;
  }
  return "Entendi. Esta é uma versão de demonstração local da NOVA IA, então minhas respostas ainda são simples. Pode continuar — estou acompanhando a conversa.";
}