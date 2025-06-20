import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    axios.post('/api/view-appointments')
      .then(res => setAppointments(res.data.appointments));
  }, []);

  return (
    <>
      <h3>All Appointments</h3>
      <ul>
        {appointments.map((a, i) => (
          <li key={i}>
            {a.patient_name} → {a.doctor_name} ({a.department}) at {a.appointment_time}
          </li>
        ))}
      </ul>
    </>
  );
}
