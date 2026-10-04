import { env, pipeline, TextStreamer, type TextGenerationPipeline } from "@huggingface/transformers";
import { brandResponse, buildMessages, generationSettings } from "../lib/nova-engine";
import { ENGINE_ERROR, type GenerateRequest, type WorkerResponse } from "../lib/nova-protocol";

// Only weights and tokenizer files are downloaded. Inference stays in this worker.
const MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";
const REVISION = "da1453100cf3ff33ef56d17983fc7a8648706db6";
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = new URL("/nova-runtime/", self.location.origin).href;
  // Works on mobile and private hosting without cross-origin isolation headers.
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = false;
}

let generator: TextGenerationPipeline | null = null;
let busy = false;
let gpuUsed = false;
class UseCPU extends Error {}
const post = (message: WorkerResponse) => self.postMessage(message);

async function loadGenerator(id: number, cpuOnly: boolean): Promise<TextGenerationPipeline> {
  if (generator) return generator;
  const progress_callback = (info: { status: string; file?: string; progress?: number }) => {
    if (info.status === "progress" && info.file?.endsWith(".onnx")) {
      const percent = Number.isFinite(info.progress) ? Math.max(0, Math.min(100, Math.floor(info.progress!))) : null;
      post({ id, type: "loading", stage: "download", progress: percent });
    } else if (info.status === "initiate") {
      post({ id, type: "loading", stage: "starting", progress: null });
    } else if (info.status === "done" && info.file?.endsWith(".onnx")) {
      post({ id, type: "loading", stage: "starting", progress: 100 });
    }
  };
  const options = { revision: REVISION, progress_callback };
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ features: { has(name: string): boolean } } | null> } }).gpu;
  let accelerated = false;
  try { if (!cpuOnly) accelerated = Boolean((await gpu?.requestAdapter())?.features.has("shader-f16")); } catch {}
  if (accelerated) {
    try {
      gpuUsed = true;
      generator = await pipeline<"text-generation">("text-generation", MODEL_ID, { ...options, dtype: "q4f16", device: "webgpu" });
    } catch {
      // A fresh worker resets the runtime after a failed GPU initialization.
      throw new UseCPU();
    }
  }
  if (!generator) generator = await pipeline<"text-generation">("text-generation", MODEL_ID, { ...options, dtype: "q8", device: "wasm" });
  return generator;
}

self.addEventListener("message", async (event: MessageEvent<GenerateRequest>) => {
  if (busy) return;
  busy = true;
  const { id, messages, effort, cpuOnly } = event.data;
  try {
    post({ id, type: "loading", stage: "starting", progress: null });
    const model = await loadGenerator(id, cpuOnly);
    post({ id, type: "generating" });
    let answer = "";
    const streamer = new TextStreamer(model.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (chunk: string) => {
        answer += chunk;
        post({ id, type: "text", text: brandResponse(answer) });
      },
    });
    const chatOptions = { tokenize: false, add_generation_prompt: true, enable_thinking: false };
    const prompt = model.tokenizer.apply_chat_template(buildMessages(messages, effort), chatOptions);
    if (typeof prompt !== "string") throw new Error("Formato de conversa inválido.");
    const result = await model(prompt, { ...generationSettings(effort), streamer });
    const first = result[0];
    if (first && "generated_text" in first) {
      const generated = first.generated_text;
      if (typeof generated === "string") answer = generated;
      else answer = generated.at(-1)?.content ?? answer;
    }
    post({ id, type: "complete", text: brandResponse(answer) });
  } catch (error) {
    generator = null;
    if ((error instanceof UseCPU || gpuUsed) && !cpuOnly) post({ id, type: "cpu-fallback" });
    else post({ id, type: "error", message: ENGINE_ERROR });
  } finally {
    busy = false;
  }
});
