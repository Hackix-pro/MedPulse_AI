import { getLlama, LlamaChatSession } from "node-llama-cpp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Loading llama...");
  const llama = await getLlama();
  
  const defaultModelPath = path.resolve(__dirname, "../model/qwen/qwen2.5-3b-instruct-q4_k_m.gguf");
  const modelPath = process.env.MODEL_PATH ? path.resolve(process.env.MODEL_PATH) : defaultModelPath;

  console.log(`Loading model from: ${modelPath}`);
  const model = await llama.loadModel({
    modelPath
  });

  const context = await model.createContext();
  const session = new LlamaChatSession({ contextSequence: context.getSequence() });

  console.log("Model loaded! Prompting...");
  const q1 = "What is the capital of France?";
  console.log("User: " + q1);

  const a1 = await session.prompt(q1);
  console.log("AI: " + a1);
}

main().catch(console.error);
