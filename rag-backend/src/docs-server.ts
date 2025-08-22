import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.DOCS_PORT || 3001;

// Serve static files from the docs directory
const docsPath = path.join(__dirname, '..', 'docs');

// Check if docs directory exists
if (!fs.existsSync(docsPath)) {
  console.error(`Docs directory not found at ${docsPath}`);
  process.exit(1);
}

// Serve static files
app.use(express.static(docsPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-documentation' });
});

// Redirect root to docs
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Start the server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   API Documentation Server                 ║
╚═══════════════════════════════════════════╝

📚 Documentation available at:
   http://localhost:${PORT}

📖 OpenAPI Specification:
   http://localhost:${PORT}/openapi.yaml

🔍 Interactive API Explorer:
   http://localhost:${PORT}/index.html
`);
});