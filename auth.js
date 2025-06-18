const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const config = require('./config/config');

const pool = new Pool(config.PG_CONFIG);

// ✅ Register
// ✅ Register a new user
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // ✅

  const handleRegister = async () => {
    if (!username || !password) {
      alert('Username and password are required');
      return;
    }

    try {
      const res = await axios.post('/api/register', { username, password });
      if (res.data.message) {
        alert('✅ Registered successfully!');
        navigate('/'); // ✅ Redirect to home page (login screen)
      } else {
        alert('Something went wrong during registration');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="form-container">
      <h2>📝 Register</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Create password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

// ✅ Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    req.session.user = { id: user.id, username: user.username };
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// ✅ Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ✅ Check Auth
router.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
