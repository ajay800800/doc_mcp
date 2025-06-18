const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs-extra');

const mcpRoutes = require('./mcp/index');
const authRoutes = require('./auth'); // ✅ Import auth routes

const app = express();
const PORT = 3007;

// Ensure required folders exist
fs.ensureDirSync('./data/databases');
fs.ensureDirSync('./logs');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Session must come before routes that use it
app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));

// ✅ Mount routes
app.use('/api', authRoutes);     // /api/login, etc.
app.use('/api', mcpRoutes);      // /api/ask-llm, /api/execute, etc.

app.listen(PORT, () => {
  console.log(`✅ MCP Server running at http://localhost:${PORT}`);
});
