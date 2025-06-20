import React, { useState } from 'react';
import axios from 'axios';


export default function BookAppointment() {
  const [form, setForm] = useState({
    patient_name: '',
    age: '',
    contact: '',
    doctor_id: '',
    time: ''
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/book', form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  return (
    <div className="form-wrapper">
      <h2>📅 Book Appointment</h2>
      <form onSubmit={handleSubmit}>
        <input name="patient_name" placeholder="Patient Name" value={form.patient_name} onChange={handleChange} required />
        <input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} />
        <input name="contact" placeholder="Contact" value={form.contact} onChange={handleChange} />
        <input name="doctor_id" type="number" placeholder="Doctor ID" value={form.doctor_id} onChange={handleChange} required />
        <input name="time" placeholder="Time (e.g., 10:00)" value={form.time} onChange={handleChange} required />
        <button type="submit">Book</button>
      </form>

      {result && (
        <div className="result">
          ✅ Appointment ID: <b>{result.appointment_id}</b>
        </div>
      )}
      {error && <div className="error">❌ {error}</div>}
    </div>
  );
}
