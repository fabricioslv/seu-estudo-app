// create-app-with-speed-insights.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current App.js file
const appJsPath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Add the SpeedInsights import
if (!appJsContent.includes('SpeedInsights')) {
  appJsContent = appJsContent.replace(
    "import { AuthProvider } from './context/AuthContext';",
    "import { AuthProvider } from './context/AuthContext';\nimport { SpeedInsights } from '@vercel/speed-insights/react';"
  );
  
  // Add the SpeedInsights component at the end of the main div
  appJsContent = appJsContent.replace(
    '</main>',
    '      <SpeedInsights />\n      </main>'
  );
}

// Write the updated content back to the file
fs.writeFileSync(appJsPath, appJsContent);
console.log('Successfully added SpeedInsights to App.js');