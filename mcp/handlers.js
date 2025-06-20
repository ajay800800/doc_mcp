const config = require('../config/config');
const { Pool } = require('pg');
const db = require('../services/database');
const files = require('../services/fileManager');
const log = require('../services/logger');
const validate = require('../utils/validators');
const axios = require('axios');

const path = require('path');
const fs = require('fs');

// Create a new database
exports.createDatabase = (req, res) => {
  const { db_name } = req.body;
  if (!validate.isValidName(db_name)) {
    return res.status(400).json({ error: 'Invalid database name' });
  }

  try {
    const result = db.createDatabase(db_name);
    log.write(`Created DB: ${db_name}`);
    return res.json({ message: `Database ${db_name} created.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Execute general SQL queries (create table, insert, select, delete, update)
exports.executeQuery = (req, res) => {
  const { db_name, query } = req.body;
  console.log(db_name);
  if (!validate.isValidName(db_name)) {
    return res.status(400).json({ error: 'Invalid database name' });
  }
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing SQL query' });
  }

  db.runQuery(db_name, query, (err, rows) => {
    if (err) {
      log.write(`SQL error on ${db_name}: ${err.message} | Query: ${query}`);
      return res.status(500).json({ error: err.message });
    }
    log.write(`Executed query on ${db_name}: ${query}`);
    return res.json({ result: rows });
  });
};

// Read file contents
exports.readFile = (req, res) => {
  const { file_path } = req.body;
  if (!file_path || typeof file_path !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing file_path' });
  }

  try {
    const data = files.read(file_path);
    log.write(`Read file: ${file_path}`);
    return res.json({ content: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Write content to file
exports.writeFile = (req, res) => {
  const { file_path, content } = req.body;
  if (!file_path || typeof file_path !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing file_path' });
  }
  if (content === undefined) {
    return res.status(400).json({ error: 'Missing content' });
  }

  try {
    files.write(file_path, content);
    log.write(`Wrote to file: ${file_path}`);
    return res.json({ message: 'File written successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.askLLM = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing prompt' });
  }

  try {
    const toolsPath = path.join(__dirname, '../tools.json');
    const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf-8'));

    const formattedTools = tools.map(tool => {
      return `- ${tool.name}: ${tool.description}\n  Method: ${tool.method}\n  Endpoint: ${tool.endpoint}\n  Params: ${JSON.stringify(tool.params)}`;
    }).join('\n\n');

    // 🧠 Context to teach LLM correct SQL and formatting
    const dbContext = `
You are working with a PostgreSQL database named "mcp". It contains:

1. doctors
   - doctor_id SERIAL PRIMARY KEY
   - name TEXT
   - department TEXT
   - available_slots JSONB (e.g. ["10:00", "11:00"])

2. patients
   - patient_id SERIAL PRIMARY KEY
   - name TEXT
   - age INTEGER
   - contact TEXT

3. appointments
   - appointment_id SERIAL PRIMARY KEY
   - doctor_id INTEGER (FK → doctors)
   - patient_id INTEGER (FK → patients)
   - appointment_time TEXT

🔍 Important SQL rules:
- To find doctors available at a given time, use:
  SELECT * FROM doctors WHERE available_slots @> '[\"10:00\"]';

✅ Valid SQL example:
  "query": "SELECT * FROM doctors WHERE available_slots @> '[\\\"10:00\\\"]';"

❌ DO NOT USE:
- JavaScript string concatenation: '" + time + "'
- Over-escaped JSON like '[\\'10:00\\']'
- Single-quoted values inside JSON array
- Any "+" signs or mixing of variables in SQL

✅ Always return a plain SQL string as value of "query", inside:
  {
    "tool": "tool-name",
    "params": {
      "db_name": "mcp",
      "query": "valid SQL here"
    }
  }

📦 Response format:
Return ONLY a **pure JSON array  of only one Tool   ** (no markdown, no explanations) like one tool query can be run when required.

[
  {
    "tool": "tool-name",
    "params": {
      ...
    }
  }
]
`;

    const llmPrompt = `
You are a smart backend assistant that helps choose tool and compose SQL commands only when required , call only required tool not unneccesarry tool .

${dbContext}

Available tools:
${formattedTools}

User command:
"${prompt}"
`;

    // 🔁 Send to local LLM or Ollama
    const llmResponse = await axios.post(config.LLM_API_URL, {
      model: "mistral",
      prompt: llmPrompt,
      stream: false
    });

    const responseText = llmResponse.data.response || '';
    console.log("🔍 LLM replied:", responseText);
    log.write(`LLM raw response: ${responseText}`);

    // 🧹 Fix bad quote handling from LLM
    let cleanJson = responseText
      .replace(/\\'/g, "'")
      .replace(/'"\[/g, '["')
      .replace(/\]\"'/g, ']')
      .replace(/@>\s*'\[\\""\s*\+\s*["']([^"']+)["']\s*\+\s*\\""\]';?/g, "@> '[\"$1\"]';")
      .replace(/@>\s*'\[\\?'"\s*\+\s*["']([^"']+)["']\s*\+\s*\\?"'\]';?/g, "@> '[\"$1\"]';")
      .replace(/@>\s*'?\[\\"?'?\s*\+\s*["']([^"']+)["']\s*\+\s*\\"?'?\]';?/g, "@> '[\"$1\"]';");

    // ✅ Parse JSON
    let toolCalls;
    try {
      toolCalls = JSON.parse(cleanJson);
      if (!Array.isArray(toolCalls)) toolCalls = [toolCalls];
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON from LLM", raw: responseText });
    }

    // 🔄 Execute tool calls
    let results=[];
    for (const { tool, params } of toolCalls) {
      const toolInfo = tools.find(t => t.name === tool);
      if (!toolInfo) {
        results.push({ tool, error: "Tool not found" });
        continue;
      }

      try {
        const apiURL = `http://localhost:${config.PORT || 3001}${toolInfo.endpoint}`;
        const result = await axios({
          method: toolInfo.method.toLowerCase(),
          url: apiURL,
          data: params
        });
        results.push(result.data );
      } catch (err) {
        results.push({ tool, error: err.message });
      }
    }

    return res.json({ results });

  } catch (err) {
    return res.status(500).json({ error: "askLLM failed: " + err.message });
  }
};
exports.viewAvailableDoctors = async (req, res) => {
  const { time } = req.body;
  if (!time) return res.status(400).json({ error: 'Missing time parameter' });

  const { Pool } = require('pg');
  const pool = new Pool(config.PG_CONFIG);

  try {
    const query = `
      SELECT * FROM doctors
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(available_slots) AS slot
        WHERE slot::time > $1::time
      )
      AND NOT (available_slots @> $2::jsonb);
    `;
    const result = await pool.query(query, [time, JSON.stringify([time])]);
    res.json({ available_doctors: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    pool.end();
  }
};

exports.bookAppointment = async (req, res) => {
  const { patient_name, age, contact, doctor_id, time } = req.body;
  if (!patient_name || !doctor_id || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { Pool } = require('pg');
  const pool = new Pool(config.PG_CONFIG);

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Insert patient
    const patientResult = await pool.query(
      `INSERT INTO patients (name, age, contact) VALUES ($1, $2, $3) RETURNING patient_id`,
      [patient_name, age || null, contact || null]
    );
    const patient_id = patientResult.rows[0].patient_id;

    // Insert appointment
    const apptResult = await pool.query(
      `INSERT INTO appointments (doctor_id, patient_id, appointment_time) VALUES ($1, $2, $3) RETURNING appointment_id`,
      [doctor_id, patient_id, time]
    );

    // Update doctor's available_slots (remove booked time)
    await pool.query(
      `UPDATE doctors SET available_slots = available_slots - $1::text WHERE doctor_id = $2`,
      [time, doctor_id]
    );

    await pool.query('COMMIT');

    res.json({
      message: 'Appointment booked successfully',
      appointment_id: apptResult.rows[0].appointment_id
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    pool.end();
  }
};


exports.viewAppointments = async (req, res) => {
  const { Pool } = require('pg');
  const pool = new Pool(config.PG_CONFIG);

  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.appointment_time,
        d.name AS doctor_name,
        d.department,
        p.name AS patient_name,
        p.age,
        p.contact
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN patients p ON a.patient_id = p.patient_id
    `);
    res.json({ appointments: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    pool.end();
  }
};
// POST /api/simple-llm
exports.simpleLlmReply = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).send('❌ Invalid or missing prompt');
  }

  try {
    const llmResponse = await axios.post(config.LLM_API_URL, {
      model: "mistral", // or "gemma"
      prompt,
      stream: false
    });

    const response = llmResponse.data.response || '';
    log.write(`SimpleLLM: ${prompt} → ${response}`);

    // ✅ Return as plain text
    res.setHeader('Content-Type', 'text/plain');
    return res.send(response.trim());

  } catch (err) {
    return res.status(500).send('❌ LLM Error: ' + err.message);
  }
};

exports.bookAppointmentWithExistingPatient = async (req, res) => {
  let { doctor_id, patient_id, time} = req.body;
  if (!doctor_id || !patient_id || !time) {
    return res.status(400).json({ error: 'Missing doctor_id, patient_id, or time' });
  }
  time = time.replace(/^'+|'+$/g, '');

  const { Pool } = require('pg');
  const pool = new Pool(config.PG_CONFIG);

  try {
    // Step 1: Check slot availability
    const doctorRes = await pool.query(
      `SELECT available_slots FROM doctors WHERE doctor_id = $1`,
      [doctor_id]
    );

    const doctor = doctorRes.rows[0];
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const slots = doctor.available_slots || [];
    if (!slots.includes(time)) {
      return res.status(400).json({ error: `Slot ${time} not available` });
    }

    // Step 2: Book appointment
    await pool.query('BEGIN');

    const apptResult = await pool.query(
      `INSERT INTO appointments (doctor_id, patient_id, appointment_time) VALUES ($1, $2, $3) RETURNING appointment_id`,
      [doctor_id, patient_id, time]
    );

    // Step 3: Update slots
    await pool.query(
      `UPDATE doctors SET available_slots = available_slots - $1::text WHERE doctor_id = $2`,
      [time, doctor_id]
    );

    await pool.query('COMMIT');

    res.json({
      message: 'Appointment booked successfully',
      appointment_id: apptResult.rows[0].appointment_id
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    pool.end();
  }
};

exports.bookAppointment = async (req, res) => {
  const { patient_name, age, contact, doctor_id, time } = req.body;
  if (!patient_name || !doctor_id || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { Pool } = require('pg');
  const pool = new Pool(config.PG_CONFIG);

  try {
    await pool.query('BEGIN');

    // ✅ Step 1: Insert patient
    const patientRes = await pool.query(
      `INSERT INTO patients (name, age, contact) VALUES ($1, $2, $3) RETURNING patient_id`,
      [patient_name, age || null, contact || null]
    );
    const patient_id = patientRes.rows[0].patient_id;

    // ✅ Step 2: Check doctor and slot
    const doctorRes = await pool.query(
      `SELECT available_slots FROM doctors WHERE doctor_id = $1`,
      [doctor_id]
    );
    if (doctorRes.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const slots = doctorRes.rows[0].available_slots;
    if (!slots.includes(time)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: `Doctor not available at ${time}` });
    }

    // ✅ Step 3: Book appointment
    const appointmentRes = await pool.query(
      `INSERT INTO appointments (doctor_id, patient_id, appointment_time)
       VALUES ($1, $2, $3) RETURNING appointment_id`,
      [doctor_id, patient_id, time]
    );

    // ✅ Step 4: Remove time slot
    await pool.query(
      `UPDATE doctors SET available_slots = available_slots - $1::text WHERE doctor_id = $2`,
      [time, doctor_id]
    );

    await pool.query('COMMIT');

    return res.json({
      message: 'Appointment booked successfully',
      appointment_id: appointmentRes.rows[0].appointment_id
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    pool.end();
  }
};










