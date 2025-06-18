// module.exports = {
//   DATA_DIR: './data/databases',
//   LOG_FILE: './logs/operations.log',
//   LLM_API_URL: 'http://localhost:11434/api/generate', // Ollama endpoint
// };
module.exports = {
  PG_CONFIG: {
    user: 'mcpuser',
    host: 'localhost',
    database: 'mcp',
    password: 'mcppass',
    port: 5432
  },
  LOG_FILE: './logs/operations.log',   // ✅ Add this line
  PORT: 3007,
  LLM_API_URL: 'http://localhost:11434/api/generate'
};
