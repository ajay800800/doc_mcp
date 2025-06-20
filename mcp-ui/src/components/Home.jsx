import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home({ isAuthenticated }) {
  return (
    <div className="home-container">
      <div className="home-overlay">
        <h1 className="home-title">🏥 MCP Hospital Assistant</h1>
        <p className="home-sub">Smart Appointment & Doctor Management</p>

        <div className="home-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/add-doctor" className="home-btn">➕ Add Doctor</Link>
              <Link to="/add-patient" className="home-btn">➕ Add Patient</Link>
              <Link to="/book-appointment" className="home-btn">📅 Book Appointment</Link>
              <Link to="/doctors" className="home-btn">📋 View Doctors</Link>
              <Link to="/appointments" className="home-btn">📋 View Appointments</Link>
              <Link to="/chat" className="home-btn">💬 Ask Assistant</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="home-btn">🔐 Login</Link>
              <Link to="/register" className="home-btn">📝 Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
