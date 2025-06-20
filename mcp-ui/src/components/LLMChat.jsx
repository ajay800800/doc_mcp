import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LLMChat.css';
import { useChat } from './ChatContex'; // adjust path if needed
export default function LLMChat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [useTools, setUseTools] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const endpoint = useTools ? '/api/ask-llm' : '/api/simple-llm';
      const res = await axios.post(endpoint, { prompt: userMsg.text });
      const rawReply = res.data;

      const formatted = formatReply(rawReply);
      setMessages((prev) => [...prev, { role: 'bot', text: formatted }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', text: '❌ LLM Error' }]);
    }
    setLoading(false);
  };

  const formatReply = (data) => {
  if (typeof data === 'string') return data;

  const first = Array.isArray(data?.results) ? data.results[0]?.result || data.results[0] : null;

  // ✅ 1. Check for available_doctors block
  const doctorBlock =
    Array.isArray(first?.available_doctors)
      ? first.available_doctors
      : Array.isArray(data?.available_doctors)
        ? data.available_doctors
        : null;

  if (doctorBlock) {
    return (
      <table className="result-table">
        <thead>
          <tr>
            <th>Doctor ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Available Slots</th>
          </tr>
        </thead>
        <tbody>
          {doctorBlock.map((doc, i) => (
            <tr key={i}>
              <td>{doc.doctor_id}</td>
              <td>{doc.name}</td>
              <td>{doc.department}</td>
              <td>{Array.isArray(doc.available_slots) ? doc.available_slots.join(', ') : doc.available_slots}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ✅ 2. Check for appointments
  const appointmentBlock =
    Array.isArray(first?.appointments)
      ? first.appointments
      : Array.isArray(data?.appointments)
        ? data.appointments
        : null;

  if (appointmentBlock) {
    return (
      <table className="result-table">
        <thead>
          <tr>
            <th>Appointment ID</th>
            <th>Time</th>
            <th>Doctor</th>
            <th>Department</th>
            <th>Patient</th>
            <th>Age</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          {appointmentBlock.map((appt, i) => (
            <tr key={i}>
              <td>{appt.appointment_id}</td>
              <td>{appt.appointment_time}</td>
              <td>{appt.doctor_name}</td>
              <td>{appt.department}</td>
              <td>{appt.patient_name}</td>
              <td>{appt.age}</td>
              <td>{appt.contact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ✅ 3. Generic array (fallback: patient list, doctor list, etc.)
  const genericArray = Array.isArray(first)
    ? first
    : Array.isArray(data)
      ? data
      : null;

  if (genericArray?.length) {
    const headers = Object.keys(genericArray[0] || {});
    return (
      <table className="result-table">
        <thead>
          <tr>
            {headers.map((head, i) => (
              <th key={i}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {genericArray.map((row, i) => (
            <tr key={i}>
              {headers.map((key, j) => (
                <td key={j}>
                  {Array.isArray(row[key]) ? row[key].join(', ') : String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ❌ 4. Fallback (raw object or unexpected format)
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};


  return (
    <div className="chat-wrapper">
      <h2 className="chat-title">🤖 LLM Assistant</h2>

      <label className="tool-toggle">
        <input
          type="checkbox"
          checked={useTools}
          onChange={() => setUseTools(!useTools)}
        />
        Use MCP Tools
      </label>

      <div className="chat-window" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div className="avatar">{msg.role === 'user' ? '🧑' : '🤖'}</div>
            <div className="message">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble bot">
            <div className="avatar">🤖</div>
            <div className="message"><em>Thinking...</em></div>
          </div>
        )}
      </div>

      <textarea
        className="chat-input"
        placeholder="Ask your question..."
        rows={2}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button className="send-btn" onClick={sendPrompt} disabled={loading}>
        Ask
      </button>

      
    </div>
  );
}
