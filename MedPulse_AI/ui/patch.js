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

  // Make loadData async
  content = content.replace(/const loadData = \(\) => {/g, 'const loadData = async () => {');
  content = content.replace(/function loadData\(\) {/g, 'async function loadData() {');

  // Add awaits to storageService calls
  const methodsToAwait = [
    'getReports',
    'getAlerts',
    'getConnections',
    'getTimeline',
    'getSharedReports',
    'getDoctorNotes',
    'getNotifications',
    'getReportById',
    'updateAlertStatus',
    'addDoctorNote',
    'deleteNotification',
    'saveChatMessage',
    'clearChatHistory',
    'getChatHistory',
    'saveReport',
    'deleteReport'
  ];

  methodsToAwait.forEach(method => {
    // Replace: setReports(storageService.getReports()) -> setReports(await storageService.getReports())
    const regex1 = new RegExp(`storageService\\.${method}\\(`, 'g');
    // But we only want to await if it's not already awaited and not part of an arrow function that we don't want to break.
    // Let's just blindly add await and then we'll fix duplicate awaits
    content = content.replace(regex1, `await storageService.${method}(`);
  });

  content = content.replace(/await await/g, 'await');
  content = content.replace(/await\s+await/g, 'await');

  // Fix useEffects where we might have introduced `await` directly inside the non-async useEffect body
  // If we have `useEffect(() => { await ... })`, this is a syntax error.
  // We need to look for `useEffect(() => {` and see if there are awaits inside it that are not in an async wrapper.
  // A common pattern is `useEffect(() => { loadData(); }, [])` which is fine (loadData returns Promise now).
  // But if `useEffect(() => { setReport(await storageService.getReportById(...)) })` it's bad.
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
