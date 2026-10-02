import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("Creating dummy image...");
  // Create a minimal 1x1 image, or we just write a simple node-canvas image if we can, 
  // but let's just wait to test OCR on real uploads.
  console.log("Loading tesseract...");
  
  const worker = await Tesseract.createWorker('eng');
  console.log("Worker created.");
  await worker.terminate();
}

main().catch(console.error);
