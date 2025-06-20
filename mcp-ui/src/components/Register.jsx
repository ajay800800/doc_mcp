import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const register = async () => {
    if (!username || !password) {
      setMessage('⚠️ Please enter username and password');
      return;
    }

    try {
      const res = await axios.post('/api/register', { username, password });
      setMessage(res.data.message || '✅ Registered');

      // ⏳ Optional: wait a moment, then navigate to login
      setTimeout(() => {
        navigate('/'); // or '/login' if you have a separate login route
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || '❌ Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>📝 Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={register}>Register</button>
      <p>{message}</p>
    </div>
  );
}
