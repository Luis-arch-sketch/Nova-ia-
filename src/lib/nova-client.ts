import { brandResponse, type ChatMessage } from "./nova-engine";
import type { EffortLevel } from "./effort";
import { ENGINE_ERROR, type EngineState, type GenerateRequest, type WorkerResponse } from "./nova-protocol";

type Callbacks = { onState: (state: EngineState) => void; onText: (text: string) => void };
type Job = Callbacks & { id: number; request: GenerateRequest; resolve: (text: string) => void; reject: (error: Error) => void };

export class NovaEngine {
  private worker: Worker | null = null;
  private job: Job | null = null;
  private nextId = 0;
  private cpuOnly = false;

  constructor(private readonly createWorker = () => new Worker(new URL("../workers/nova-ai.worker.ts", import.meta.url), { type: "module" })) {}

  generate(messages: ChatMessage[], effort: EffortLevel, callbacks: Callbacks): Promise<string> {
    if (this.job) return Promise.reject(new Error("A NOVA IA já está respondendo."));
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const request: GenerateRequest = { id, messages, effort, cpuOnly: this.cpuOnly };
      this.job = { id, request, resolve, reject, ...callbacks };
      callbacks.onState({ phase: "loading", progress: null, stage: "starting" });
      try {
        this.startWorker(request);
      } catch {
        this.fail();
      }
    });
  }

  private startWorker(request: GenerateRequest) {
    if (!this.worker) {
      const worker = this.createWorker();
      this.worker = worker;
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => { if (this.worker === worker) this.receive(event.data); };
      worker.onerror = (event) => { event.preventDefault(); if (this.worker === worker) this.fail(); };
      worker.onmessageerror = () => { if (this.worker === worker) this.fail(); };
    }
    this.worker.postMessage(request);
  }

  private receive(message: WorkerResponse) {
    const job = this.job;
    if (!job || job.id !== message.id) return;
    switch (message.type) {
      case "loading":
        job.onState({ phase: "loading", progress: message.progress, stage: message.stage });
        break;
      case "generating":
        job.onState({ phase: "generating" });
        break;
      case "cpu-fallback":
        if (job.request.cpuOnly) { this.fail(); break; }
        this.cpuOnly = true;
        this.worker?.terminate();
        this.worker = null;
        job.request = { ...job.request, cpuOnly: true };
        job.onText("");
        job.onState({ phase: "loading", progress: null, stage: "starting" });
        try { this.startWorker(job.request); } catch { this.fail(); }
        break;
      case "text":
        job.onText(brandResponse(message.text));
        break;
      case "complete": {
        const text = brandResponse(message.text);
        if (!text) { this.fail(); break; }
        this.job = null;
        job.onState({ phase: "ready" });
        job.resolve(text);
        break;
      }
      case "error":
        this.fail();
        break;
    }
  }

  private fail() {
    const job = this.job;
    this.job = null;
    this.worker?.terminate();
    this.worker = null;
    job?.reject(new Error(ENGINE_ERROR));
  }

  cancel() {
    const job = this.job;
    this.job = null;
    // Terminating also stops downloads and synchronous WASM work immediately.
    this.worker?.terminate();
    this.worker = null;
    job?.reject(new DOMException("Resposta interrompida.", "AbortError"));
  }

  dispose() { this.cancel(); }
}
