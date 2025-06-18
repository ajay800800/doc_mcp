// Instead of this:
import sqlite3 from 'sqlite3';
import path from 'path';
import config from '../config/config.js';
import fs from 'fs-extra';
import axios from 'axios';

// ✅ Use this:
const sqlite3 = require('sqlite3');
const path = require('path');
const config = require('../config/config');
const fs = require('fs-extra');
const axios = require('axios');

async function queryLLM(prompt) {
  try {
    const response = await axios.post(LLM_API_URL, {
      model: "google/gemma-3-12b-it",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const text = response.data.choices?.[0]?.message?.content || "No response";
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `LLM Error: ${err.message}` }] };
  }
}

module.exports = { queryLLM };
