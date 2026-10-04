import { classifyIntent } from "./intent";
import { DEFAULT_EFFORT, effortIndex, type EffortLevel } from "./effort";

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

const EXAMPLES: Record<string, string> = {
  casa: "Exemplo: depois da escola, voltei para casa.",
  amor: "Exemplo: cuidar de alguém pode ser uma maneira de demonstrar amor.",
  curiosidade: "Exemplo: perguntar como um jogo foi criado demonstra curiosidade.",
  jogo: "Exemplo: xadrez é um jogo com regras e objetivos definidos.",
  galaxia: "Exemplo: o Sistema Solar faz parte da Via Láctea.",
  inteligencia: "Exemplo: aprender uma estratégia nova para resolver um problema.",
};

// O esforço ajusta o detalhamento do mecanismo local, sem serviços externos.
export function reply(input: string, options: { effort?: EffortLevel } = {}): string {
  const detail = effortIndex(options.effort ?? DEFAULT_EFFORT);
  const intent = classifyIntent(input);
  if (intent.kind === "greeting") {
    if (detail === 0) return "Olá! Como posso ajudar?";
    return "Olá! Eu sou a NOVA IA. Como posso ajudar você hoje?";
  }
  if (intent.kind === "definition") {
    const term = strip(intent.term);
    const def = GLOSSARY[term];
    if (def) {
      const parts = [`**${intent.term}**: ${def}`];
      if (detail >= 3 && EXAMPLES[term]) parts.push(EXAMPLES[term]);
      if (detail === 4) parts.push("Posso também usar essa palavra em uma frase relacionada ao seu assunto.");
      return parts.join("\n\n");
    }
    return `Ainda não tenho uma definição salva para “${intent.term}” nesta versão local da NOVA IA. Pode me dar mais contexto?`;
  }
  const normalized = strip(input);
  const plan = (title: string, steps: string[]) => {
    const chosen = steps.slice(0, detail + 1);
    return detail === 0 ? chosen[0]! : `**${title}**\n\n${chosen.map((step, i) => `${i + 1}. ${step}`).join("\n")}`;
  };
  if (/(?:organizar|planejar|rotina de estudos|plano de estudos)/.test(normalized)) {
    return plan("Organize sua rotina", [
      "Escolha a tarefa ou matéria mais importante para começar.",
      "Separe um horário disponível e divida a tarefa em partes pequenas.",
      "Faça uma pausa entre as partes para descansar.",
      "Reserve um momento para revisar o que aprendeu e anotar dúvidas.",
      "Confira o que conseguiu terminar e ajuste o próximo dia. Se me disser seus horários e matérias, posso ajudar a montar a divisão.",
    ]);
  }
  if (/\bideias?\b/.test(normalized)) {
    return plan("Ideias para seu projeto", [
      "Crie uma versão pequena de um jogo de perguntas ou de memória.",
      "Escolha um tema e defina uma única mecânica principal.",
      "Monte primeiro um protótipo com formas simples e teste se é divertido.",
      "Adicione uma fase curta, uma pontuação e instruções claras.",
      "Peça para alguém jogar e use o que observar para melhorar o protótipo. Conte o estilo de projeto que você prefere para eu adaptar as ideias.",
    ]);
  }
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    if (detail === 0) return `Quer conversar sobre “${words[0]}”?`;
    return `Você escreveu “${words[0]}”. Quer conversar sobre isso? Conte um pouco mais do que você tem em mente. Se quiser o significado, é só perguntar “o que significa ${words[0]}?”.`;
  }
  if (detail === 0) return "Entendi. Conte o que você precisa.";
  if (detail >= 3) return "Entendi. Esta versão local da NOVA IA ainda tem respostas simples.\n\nConte seu objetivo e o contexto do pedido. Posso organizar uma rotina, sugerir um projeto ou explicar os termos que já conheço quando você pedir.";
  return "Entendi. Esta é uma versão de demonstração local da NOVA IA, então minhas respostas ainda são simples. Pode continuar — estou acompanhando a conversa.";
}
