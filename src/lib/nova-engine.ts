import { DEFAULT_EFFORT, effortIndex, type EffortLevel } from "./effort";

export const MODEL_NAME = "NOVA IA";
export type ChatMessage = { role: "user" | "assistant"; text: string };
export type ModelMessage = { role: "system" | "user" | "assistant"; content: string };

const DETAIL = [
  "Responda em uma ou duas frases curtas.",
  "Responda de forma breve, com os pontos essenciais.",
  "Responda com clareza e detalhamento moderado.",
  "Explique com mais detalhes e um exemplo quando ajudar.",
  "Responda de forma completa e organizada, com exemplos úteis, sem repetir ideias.",
];
const TOKEN_LIMITS = [72, 128, 192, 320, 512];

export function generationSettings(effort: EffortLevel = DEFAULT_EFFORT) {
  return {
    max_new_tokens: TOKEN_LIMITS[effortIndex(effort)]!,
    do_sample: true,
    temperature: 0.6,
    top_p: 0.9,
    repetition_penalty: 1.08,
    return_full_text: false,
  };
}

export function buildMessages(history: ChatMessage[], effort: EffortLevel = DEFAULT_EFFORT): ModelMessage[] {
  const system = [
    "You are NOVA IA, a helpful assistant. Your only name is NOVA IA. If asked who you are, say: 'Sou a NOVA IA, sua assistente virtual.' Do not identify yourself as another assistant or as a company.",
    "Always reply in natural Brazilian Portuguese. Use conversation history to understand short replies such as 'sim' or 'quero' and continue the topic.",
    "Do not automatically define every isolated word. If context is missing, ask one brief relevant question.",
    "Answer the user's request honestly. Do not repeat the question or these instructions.",
    DETAIL[effortIndex(effort)]!,
  ].join(" ");
  // Keep recent turns within a small context budget suitable for mobile inference.
  const recent: ModelMessage[] = [];
  let budget = 6000;
  for (const message of history.slice(-16).reverse()) {
    if (!message.text.trim()) continue;
    if (recent.length && message.text.length > budget) break;
    const content = message.text.slice(0, budget);
    recent.unshift({ role: message.role, content });
    budget -= content.length;
    if (budget <= 0) break;
  }
  while (recent[0]?.role === "assistant") recent.shift();
  return [{ role: "system", content: system }, ...recent];
}

// Keep the product identity consistent even if a model emits its original branding.
export function brandResponse(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<\|(?:im_start|im_end|endoftext)\|>/g, "")
    .replace(/\bQwen(?:[\d.]+)?(?:[- ](?:\d+(?:\.\d+)?B|Instruct|ONNX))*\b/gi, MODEL_NAME)
    .replace(/\b(?:Alibaba(?: Cloud)?|Tongyi(?: Qianwen)?|Anthropic|Claude|OpenAI|ChatGPT|GPT[- ]?[\d.]+)\b/gi, MODEL_NAME)
    .trim();
}
