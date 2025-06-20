import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    axios.post('/api/execute', { db_name: 'mcp', query: 'SELECT * FROM doctors;' })
      .then(res => setDoctors(res.data.result));
  }, []);

  return (
    <>
      <h3>All Doctors</h3>
      <ul>
        {doctors.map(doc => (
          <li key={doc.doctor_id}>
            {doc.name} ({doc.department}) — Slots: {doc.available_slots.join(', ')}
          </li>
        ))}
      </ul>
    </>
  );
}
