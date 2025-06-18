const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool(config.PG_CONFIG);

// ✅ Execute any SQL query
exports.runQuery = async (dbName, query, callback) => {
  try {
    const result = await pool.query(query);
    callback(null, result.rows);
  } catch (err) {
    callback(err, null);
  }
};

// ✅ Insert a row
exports.insertRecord = async (dbName, tableName, data, callback) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;

  try {
    const result = await pool.query(query, values);
    callback(null, result.rows[0]);
  } catch (err) {
    callback(err, null);
  }
};

// ✅ Select all records
exports.getAllRecords = async (dbName, tableName, callback) => {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    callback(null, result.rows);
  } catch (err) {
    callback(err, null);
  }
};

// ✅ Delete a record
exports.deleteRecord = async (dbName, tableName, condition, callback) => {
  const query = `DELETE FROM ${tableName} WHERE ${condition}`;
  try {
    const result = await pool.query(query);
    callback(null, { deleted: result.rowCount });
  } catch (err) {
    callback(err, null);
  }
};

// ✅ Update a record
exports.updateRecord = async (dbName, tableName, updates, condition, callback) => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const query = `UPDATE ${tableName} SET ${setClause} WHERE ${condition}`;

  try {
    const result = await pool.query(query, values);
    callback(null, { updated: result.rowCount });
  } catch (err) {
    callback(err, null);
  }
};

// ✅ Dummy handlers to match old SQLite API
exports.createDatabase = (dbName) => `Using PostgreSQL – no file created`;
exports.deleteDatabase = () => `Using PostgreSQL – no file deleted`;
exports.listDatabases = () => [`mcp`];
exports.createTable = async (dbName, tableName, columns, callback) => {
  const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
  try {
    await pool.query(query);
    callback(null, { message: `Table ${tableName} created.` });
  } catch (err) {
    callback(err, null);
  }
};
