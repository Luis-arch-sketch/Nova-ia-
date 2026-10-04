import { cpSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const distribution = dirname(require.resolve("@huggingface/transformers"));
const destination = "public/nova-runtime";
mkdirSync(destination, { recursive: true });
for (const file of ["ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"]) {
  cpSync(join(distribution, file), join(destination, file));
}
cpSync(join(distribution, "../LICENSE"), join(destination, "LICENSE.txt"));
