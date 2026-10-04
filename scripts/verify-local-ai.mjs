import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const asModule = (source) => "data:text/javascript," + encodeURIComponent(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText);
const effortURL = asModule(await readFile("src/lib/effort.ts", "utf8"));
const engineSource = (await readFile("src/lib/nova-engine.ts", "utf8")).replace('"./effort"', JSON.stringify(effortURL));
const { buildMessages, brandResponse, generationSettings } = await import(asModule(engineSource));
const workerSource = await readFile("src/workers/nova-ai.worker.ts", "utf8");
const modelId = workerSource.match(/const MODEL_ID = "([^"]+)"/)?.[1];
const revision = workerSource.match(/const REVISION = "([^"]+)"/)?.[1];
assert.ok(modelId && revision);

// Exercise the browser's WASM runtime in Node; only local file loading is adapted.
const ort = await import("onnxruntime-web/webgpu");
class FileSession extends ort.InferenceSession {
  static async create(model, options) {
    const data = typeof model === "string" ? new Uint8Array(await readFile(model)) : model;
    return ort.InferenceSession.create(data, options);
  }
}
globalThis[Symbol.for("onnxruntime")] = { ...ort, InferenceSession: FileSession };
const { env, pipeline, TextStreamer } = await import("@huggingface/transformers");
env.allowLocalModels = false;
env.cacheDir = process.env.NOVA_TEST_CACHE || resolve(".sites-runtime/model-cache");
env.backends.onnx.wasm.wasmPaths = dirname(require.resolve("@huggingface/transformers")) + "/";
env.backends.onnx.wasm.numThreads = 1;

const generator = await pipeline("text-generation", modelId, { revision, dtype: "q8", device: "auto" });
console.log("Motor WASM carregado.");
const cases = [
  {
    history: [{ role: "user", text: "Pi" }, { role: "assistant", text: "Quer que eu explique o número pi?" }, { role: "user", text: "Sim" }],
    expected: /3[,.]141|circunferência|diâmetro/i,
  },
  {
    history: [{ role: "user", text: "Meu nome é Luis." }, { role: "assistant", text: "Olá, Luis! Como posso ajudar?" }, { role: "user", text: "Qual é meu nome?" }],
    expected: /Luis/i,
  },
];
for (const test of cases) {
  let streamed = "";
  const prompt = generator.tokenizer.apply_chat_template(buildMessages(test.history, "baixo"), {
    tokenize: false, add_generation_prompt: true, enable_thinking: false,
  });
  const result = await generator(prompt, {
    ...generationSettings("baixo"), do_sample: false,
    streamer: new TextStreamer(generator.tokenizer, { skip_prompt: true, callback_function: (chunk) => { streamed += chunk; } }),
  });
  const answer = brandResponse(result[0].generated_text);
  assert.ok(streamed.trim(), "A resposta precisa chegar em partes.");
  assert.match(answer, test.expected);
  assert.doesNotMatch(answer, /Você escreveu|versão de demonstração|Qwen|Alibaba|Anthropic|ChatGPT/);
  console.log("Resposta verificada:", answer);
}
await generator.dispose();
