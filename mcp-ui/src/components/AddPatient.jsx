import React, { useState } from 'react';
import axios from 'axios';

export default function AddPatient() {
  const [form, setForm] = useState({ name: '', age: '', contact: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const query = `INSERT INTO patients (name, age, contact) VALUES ('${form.name}', ${form.age}, '${form.contact}');`;
    await axios.post('/api/execute', { db_name: 'mcp', query });
    alert('Patient added!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Patient</h3>
      <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Age" type="number" onChange={(e) => setForm({ ...form, age: e.target.value })} required />
      <input placeholder="Contact" onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
      <button type="submit">Submit</button>
    </form>
  );
}
