import React, { useState } from 'react';
import axios from 'axios';

export default function AddDoctor() {
  const [form, setForm] = useState({ name: '', department: '', slots: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const query = `INSERT INTO doctors (name, department, available_slots) VALUES ('${form.name}', '${form.department}', '${form.slots}'::jsonb);`;
    await axios.post('/api/execute', { db_name: 'mcp', query });
    alert('Doctor added!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Doctor</h3>
      <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Department" onChange={(e) => setForm({ ...form, department: e.target.value })} required />
      <input placeholder='Slots (e.g., ["10:00", "11:00"])' onChange={(e) => setForm({ ...form, slots: e.target.value })} required />
      <button type="submit">Submit</button>
    </form>
  );
}
