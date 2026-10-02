import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcPath = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcPath, []);

files.forEach(file => {
  if (file.includes('storageService.ts')) return;

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Reverse loadData changes
  content = content.replace(/const loadData = async \(\) => {/g, 'const loadData = () => {');
  content = content.replace(/async function loadData\(\) {/g, 'function loadData() {');

  // Reverse await storageService
  content = content.replace(/await storageService\./g, 'storageService.');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
