import type { ComponentType } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";
import { buildMessages, brandResponse } from "@/lib/nova-engine";
import type { GenerateRequest, WorkerResponse } from "@/lib/nova-protocol";

class ModelWorker {
  static instances: ModelWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  requests: GenerateRequest[] = [];
  terminated = false;
  constructor() { ModelWorker.instances.push(this); }
  postMessage(request: GenerateRequest) { this.requests.push(request); }
  terminate() { this.terminated = true; }
  emit(message: WorkerResponse) { this.onmessage?.({ data: message } as MessageEvent<WorkerResponse>); }
}

const Homepage = Route.options.component as ComponentType;
const send = (text: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Mensagem para a NOVA IA" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
};

beforeEach(() => {
  localStorage.clear();
  ModelWorker.instances = [];
  vi.stubGlobal("Worker", ModelWorker);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Conversa real da NOVA IA", () => {
  it("mostra download e texto recebido, e envia o histórico quando o usuário diz Sim", async () => {
    render(<Homepage />);
    send("Pi");
    const worker = ModelWorker.instances[0]!;
    const request = worker.requests[0]!;
    expect(request.messages).toEqual([{ role: "user", text: "Pi" }]);
    act(() => worker.emit({ id: request.id, type: "loading", stage: "download", progress: 45 }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
    act(() => worker.emit({ id: request.id, type: "generating" }));
    act(() => worker.emit({ id: request.id, type: "text", text: "Quer que eu explique o número pi?" }));
    expect(screen.getByText("Quer que eu explique o número pi?")).toBeInTheDocument();
    await act(async () => worker.emit({ id: request.id, type: "complete", text: "Quer que eu explique o número pi?" }));
    send("Sim");
    expect(worker.requests[1]!.messages).toEqual([
      { role: "user", text: "Pi" },
      { role: "assistant", text: "Quer que eu explique o número pi?" },
      { role: "user", text: "Sim" },
    ]);
    expect(screen.queryByText(/Você escreveu/)).not.toBeInTheDocument();
    await act(async () => worker.emit({ id: worker.requests[1]!.id, type: "complete", text: "Pi é a razão entre a circunferência e seu diâmetro." }));
    expect(screen.getByText(/Pi é a razão/)).toBeInTheDocument();
  });

  it("permite repetir uma falha sem duplicar a pergunta nem mostrar o modelo externo", async () => {
    render(<Homepage />);
    send("Olá");
    const worker = ModelWorker.instances[0]!;
    await act(async () => worker.emit({ id: worker.requests[0]!.id, type: "error", message: "Falha no Qwen2.5" }));
    expect(screen.getByRole("alert")).not.toHaveTextContent("Qwen");
    expect(screen.getAllByText("Olá", { selector: "section div" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    const retry = ModelWorker.instances[1]!;
    expect(retry.requests[0]!.messages).toEqual([{ role: "user", text: "Olá" }]);
    await act(async () => retry.emit({ id: retry.requests[0]!.id, type: "complete", text: "Sou a NOVA IA. Como posso ajudar?" }));
    expect(screen.getAllByText("Olá", { selector: "section div" })).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("interrompe o processamento e ignora texto de uma resposta cancelada", async () => {
    render(<Homepage />);
    send("Conte uma história");
    const worker = ModelWorker.instances[0]!;
    const id = worker.requests[0]!.id;
    fireEvent.click(screen.getByRole("button", { name: "Interromper resposta" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument());
    expect(worker.terminated).toBe(true);
    act(() => worker.emit({ id, type: "text", text: "Texto atrasado" }));
    expect(screen.queryByText("Texto atrasado")).not.toBeInTheDocument();
  });

  it("reinicia com CPU se a aceleração gráfica falhar, preservando a pergunta", async () => {
    render(<Homepage />);
    send("Explique pi");
    const gpuWorker = ModelWorker.instances[0]!;
    act(() => gpuWorker.emit({ id: gpuWorker.requests[0]!.id, type: "cpu-fallback" }));
    const cpuWorker = ModelWorker.instances[1]!;
    expect(gpuWorker.terminated).toBe(true);
    expect(cpuWorker.requests[0]!.cpuOnly).toBe(true);
    expect(cpuWorker.requests[0]!.messages).toEqual(gpuWorker.requests[0]!.messages);
    act(() => gpuWorker.emit({ id: gpuWorker.requests[0]!.id, type: "complete", text: "Texto descartado da GPU" }));
    expect(screen.queryByText("Texto descartado da GPU")).not.toBeInTheDocument();
    await act(async () => cpuWorker.emit({ id: cpuWorker.requests[0]!.id, type: "complete", text: "Pi é aproximadamente 3,14159." }));
    expect(screen.getByText("Pi é aproximadamente 3,14159.")).toBeInTheDocument();
  });

  it("preserva o contexto recente e a identidade da NOVA IA", () => {
    const messages = buildMessages([
      { role: "user", text: "x".repeat(5000) },
      { role: "assistant", text: "Quer um exemplo de pi?" },
      { role: "user", text: "Quero" },
    ], "maximo");
    expect(messages[0]!.content).toContain("Your only name is NOVA IA");
    expect(messages.at(-1)).toEqual({ role: "user", content: "Quero" });
    expect(messages.some((message) => message.content === "Quer um exemplo de pi?")).toBe(true);
    expect(brandResponse("Sou Qwen2.5-0.5B-Instruct da Alibaba Cloud.")).not.toMatch(/Qwen|Alibaba/);
  });
});
