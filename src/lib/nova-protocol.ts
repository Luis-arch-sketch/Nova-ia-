import type { ChatMessage } from "./nova-engine";
import type { EffortLevel } from "./effort";

export type GenerateRequest = { id: number; messages: ChatMessage[]; effort: EffortLevel; cpuOnly: boolean };
export type LoadingState = { phase: "loading"; progress: number | null; stage: "download" | "starting" };
export type EngineState = LoadingState | { phase: "generating" | "ready" | "idle" };
export type WorkerResponse =
  | ({ id: number; type: "loading" } & Omit<LoadingState, "phase">)
  | { id: number; type: "generating" }
  | { id: number; type: "cpu-fallback" }
  | { id: number; type: "text" | "complete"; text: string }
  | { id: number; type: "error"; message: string };

export const ENGINE_ERROR = "A NOVA IA não conseguiu responder neste aparelho. Confira sua conexão e o espaço livre e tente novamente.";
