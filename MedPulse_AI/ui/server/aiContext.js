import { getLlama } from "node-llama-cpp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let llama = null;
let model = null;
let context = null;

export async function initAI() {
  if (model) return { llama, model, context };

  const defaultModelPath = path.resolve(__dirname, "../../model/qwen/qwen2.5-3b-instruct-q4_k_m.gguf");
  const modelPath = process.env.MODEL_PATH ? path.resolve(process.env.MODEL_PATH) : defaultModelPath;

  console.log(`Checking local Qwen AI model at: ${modelPath}`);

  if (!fs.existsSync(modelPath)) {
    console.warn(`[WARN] AI model file not found at: ${modelPath}`);
    console.warn("[WARN] Local AI chat/extraction features will be unavailable until the model is placed in model/qwen/ (see model/qwen/README.md).");
    return { llama, model: null, context: null };
  }

  try {
    llama = await getLlama();
    model = await llama.loadModel({
      modelPath
    });
    context = await model.createContext({
      sequences: 4,
      contextSize: 4096
    });
    console.log("Local AI model initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize AI model:", err);
  }
  return { llama, model, context };
}

export function getAI() {
  return { llama, model, context };
}
